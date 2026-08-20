'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line, Html, Grid } from '@react-three/drei'
import * as THREE from 'three'
import type { Detection } from '@/types/csi'
import {
  DOOR_WIDTH, MATERIAL_PROPERTIES, NODE_HEIGHT, NODES, OBSTACLES, ROOM_MARGIN,
  ROOM_SIZE, WALL_HEIGHT, type Obstacle,
} from '@/utils/obstacles'
import { buildSignalPointCloud, signalColor } from '@/utils/signalField'

// room (x, y_forward, z_up) → three.js (x, z_up, -y_forward), matches PoseView3D
const toScene = (x: number, y: number, z = 0): [number, number, number] => [x, z, -y]

// Soft, additive-blended circular sprites (perspective-scaled point size,
// smoothstep alpha falloff) — the actual technique behind a "point cloud"
// looking like a glowing field instead of flat squares.
const SPLAT_VERTEX_SHADER = /* glsl */ `
  attribute float strength;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vStrength;
  void main() {
    vColor = color;
    vStrength = strength;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (26.0 + strength * 100.0) * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`
const SPLAT_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vStrength;
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, d) * (0.12 + vStrength * 0.7);
    gl_FragColor = vec4(vColor, alpha);
  }
`

/**
 * Volumetric coverage cloud — sampled across x, y AND z, so the map
 * actually shows how signal strength changes with height (near the
 * floor vs. near the ceiling), not just a flat top-down projection.
 * Rendered as soft glowing sprites (size + brightness driven by signal
 * strength per point) rather than flat dots.
 */
function SignalPointCloud() {
  const pointsObj = useMemo(() => {
    const samples = buildSignalPointCloud(18, 8, NODES, OBSTACLES)
    const n = samples.length
    const positions = new Float32Array(n * 3)
    const colors = new Float32Array(n * 3)
    const strengths = new Float32Array(n)
    samples.forEach((p, i) => {
      const [sx, sy, sz] = toScene(p.x, p.y, p.z)
      positions[i * 3] = sx
      positions[i * 3 + 1] = sy
      positions[i * 3 + 2] = sz
      const [r, g, b] = signalColor(p.strength)
      colors[i * 3] = r / 255
      colors[i * 3 + 1] = g / 255
      colors[i * 3 + 2] = b / 255
      strengths[i] = p.strength
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('strength', new THREE.BufferAttribute(strengths, 1))

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: SPLAT_VERTEX_SHADER,
      fragmentShader: SPLAT_FRAGMENT_SHADER,
    })

    return new THREE.Points(geo, material)
  }, [])

  return <primitive object={pointsObj} />
}

// Walls stay almost fully transparent — a WiFi node senses through them
// anyway, so an opaque wall would visually lie about what's detectable.
// A thin edge trace keeps the room's shape readable from any angle.
function WallSegment({ x0, y0, x1, y1 }: { x0: number; y0: number; x1: number; y1: number }) {
  const len = Math.hypot(x1 - x0, y1 - y0)
  const mx = (x0 + x1) / 2
  const my = (y0 + y1) / 2
  const angle = Math.atan2(-(y1 - y0), x1 - x0)
  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(len, WALL_HEIGHT, 0.06)),
    [len]
  )
  return (
    <group position={[mx, WALL_HEIGHT / 2, -my]} rotation={[0, -angle, 0]}>
      <mesh>
        <boxGeometry args={[len, WALL_HEIGHT, 0.06]} />
        <meshStandardMaterial color="#475569" transparent opacity={0.045} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#64748b" transparent opacity={0.4} />
      </lineSegments>
    </group>
  )
}

function RoomWalls() {
  const doorX0 = ROOM_SIZE / 2 - DOOR_WIDTH / 2
  const doorX1 = ROOM_SIZE / 2 + DOOR_WIDTH / 2
  return (
    <group>
      <WallSegment x0={0} y0={0} x1={ROOM_SIZE} y1={0} />
      <WallSegment x0={0} y0={0} x1={0} y1={ROOM_SIZE} />
      <WallSegment x0={ROOM_SIZE} y0={0} x1={ROOM_SIZE} y1={ROOM_SIZE} />
      {/* south wall with a door gap */}
      <WallSegment x0={0} y0={ROOM_SIZE} x1={doorX0} y1={ROOM_SIZE} />
      <WallSegment x0={doorX1} y0={ROOM_SIZE} x1={ROOM_SIZE} y1={ROOM_SIZE} />
    </group>
  )
}

function ReflectionRipple({ x, y, baseR }: { x: number; y: number; baseR: number }) {
  const group = useRef<THREE.Group>(null)
  const rings = useRef<THREE.Mesh[]>([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    rings.current.forEach((ring, i) => {
      if (!ring) return
      const phase = (t * 0.25 + i / 3) % 1
      const r = baseR + phase * baseR * 2.2
      ring.scale.setScalar(r / baseR)
      const mat = ring.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - phase) * 0.35
    })
  })

  return (
    <group ref={group} position={[x, 0.03, -y]}>
      {[0, 1, 2].map(i => (
        <mesh
          key={i}
          ref={el => { if (el) rings.current[i] = el }}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[baseR * 0.96, baseR, 48]} />
          <meshBasicMaterial color="#a9bdd0" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

function ObstacleMesh({ o }: { o: Obstacle }) {
  const mat = MATERIAL_PROPERTIES[o.material]
  const [sx, , sz] = toScene(o.x, o.y)

  // Scaffold: mostly-open steel frame, so a solid box would lie about
  // how much signal it actually blocks — render it as posts + edges.
  if (o.id === 'scaffold') {
    const w = o.w ?? 0.5
    const h = o.h ?? 1
    const corners: [number, number][] = [
      [-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2],
    ]
    return (
      <group position={[sx, 0, sz]}>
        {corners.map(([dx, dz], i) => (
          <mesh key={i} position={[dx, o.height / 2, dz]}>
            <cylinderGeometry args={[0.02, 0.02, o.height, 8]} />
            <meshStandardMaterial color={mat.color} metalness={mat.metalness} roughness={mat.roughness} />
          </mesh>
        ))}
        {[o.height * 0.3, o.height * 0.7].map((yy, i) => (
          <Line
            key={i}
            points={[
              [-w / 2, yy, -h / 2], [w / 2, yy, -h / 2],
              [w / 2, yy, h / 2], [-w / 2, yy, h / 2],
              [-w / 2, yy, -h / 2],
            ]}
            color={mat.color}
            lineWidth={1}
          />
        ))}
      </group>
    )
  }

  if (o.shape === 'circle') {
    const r = o.r ?? 0.3
    return (
      <group position={[sx, 0, sz]}>
        <mesh position={[0, o.height / 2, 0]}>
          <cylinderGeometry args={[r, r, o.height, 24]} />
          <meshStandardMaterial color={mat.color} metalness={mat.metalness} roughness={mat.roughness} />
        </mesh>
        {mat.reflective && <ReflectionRipple x={o.x} y={o.y} baseR={r} />}
      </group>
    )
  }

  const rw = o.w ?? 0.3
  const rh = o.h ?? 0.3
  return (
    <group position={[sx, 0, sz]} rotation={[0, -(o.rot ?? 0), 0]}>
      <mesh position={[0, o.height / 2, 0]}>
        <boxGeometry args={[rw, o.height, rh]} />
        <meshStandardMaterial color={mat.color} metalness={mat.metalness} roughness={mat.roughness} />
      </mesh>
      {mat.reflective && (
        <ReflectionRipple x={o.x} y={o.y} baseR={Math.max(rw, rh) / 2} />
      )}
    </group>
  )
}

function NodeMarker({ x, y, label }: { x: number; y: number; label: string }) {
  const [sx, , sz] = toScene(x, y)
  const meshRef = useRef<THREE.Mesh>(null)
  const phase = useMemo(() => (x + y) * 1.7, [x, y])

  // A slow pulse on scale + emissive reads as "this node is live and
  // actively transmitting", not just a static marker.
  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = state.clock.elapsedTime * 2 + phase
    mesh.scale.setScalar(1 + Math.sin(t) * 0.08)
    const mat = mesh.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.35 + (Math.sin(t) * 0.5 + 0.5) * 0.35
  })

  return (
    <group position={[sx, NODE_HEIGHT, sz]}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.18, 0.18, 0.18]} />
        <meshStandardMaterial color="#1D9E75" emissive="#1D9E75" emissiveIntensity={0.4} />
      </mesh>
      <pointLight color="#1D9E75" intensity={0.35} distance={1.6} />
      <Html position={[0, 0.28, 0]} center>
        <div className="text-[11px] font-bold text-[#1D9E75] pointer-events-none select-none bg-slate-900/60 px-1.5 py-0.5 rounded">
          {label}
        </div>
      </Html>
    </group>
  )
}

function PersonMarker({ detection }: { detection: Detection | null }) {
  if (!detection?.presence) return null
  const [sx, , sz] = toScene(detection.position.x, detection.position.y)
  return (
    <group position={[sx, 0, sz]}>
      <mesh position={[0, 0.875, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 1.75, 20]} />
        <meshStandardMaterial color="#185FA5" emissive="#185FA5" emissiveIntensity={0.5} transparent opacity={0.55} />
      </mesh>
      <pointLight position={[0, 1, 0]} color="#60a5fa" intensity={0.6} distance={2.5} />
    </group>
  )
}

function TriangulationLines({ detection }: { detection: Detection | null }) {
  if (!detection?.presence) return null
  const person = toScene(detection.position.x, detection.position.y, 0.05)
  return (
    <group>
      {NODES.map(n => (
        <Line
          key={n.nodeId}
          points={[toScene(n.position.x, n.position.y, NODE_HEIGHT), person]}
          color="#1D9E75"
          lineWidth={1}
          transparent
          opacity={0.3}
          dashed
          dashSize={0.1}
          gapSize={0.08}
        />
      ))}
    </group>
  )
}

interface Props {
  detection: Detection | null
}

export default function RoomView3D({ detection }: Props) {
  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [7.5, 6.5, 7.5], fov: 50, near: 0.1, far: 100 }}
        style={{ background: '#0a0e1a' }}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        <fogExp2 attach="fog" args={['#0a0e1a', 0.045]} />
        <ambientLight intensity={0.45} />
        <hemisphereLight color="#4488cc" groundColor="#0a0e1a" intensity={0.4} />
        <pointLight position={[5, 8, 5]} intensity={1.0} color="#ffffff" />
        <pointLight position={[0, 8, 0]} intensity={0.3} color="#a5f3fc" />

        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          minDistance={3}
          maxDistance={18}
          target={[2.5, 0.9, -2.5]}
        />

        <Grid
          args={[ROOM_SIZE + ROOM_MARGIN * 2, ROOM_SIZE + ROOM_MARGIN * 2]}
          cellSize={0.5}
          cellThickness={0.35}
          cellColor="#1e293b"
          sectionSize={ROOM_SIZE}
          sectionThickness={0.7}
          sectionColor="#334155"
          fadeDistance={20}
          fadeStrength={1}
          followCamera={false}
          position={[ROOM_SIZE / 2, 0, -ROOM_SIZE / 2]}
        />
        <SignalPointCloud />
        <RoomWalls />

        {OBSTACLES.map(o => <ObstacleMesh key={o.id} o={o} />)}

        {NODES.map(n => (
          <NodeMarker key={n.nodeId} x={n.position.x} y={n.position.y} label={`Node ${n.nodeId}`} />
        ))}

        <TriangulationLines detection={detection} />
        <PersonMarker detection={detection} />
      </Canvas>
    </div>
  )
}
