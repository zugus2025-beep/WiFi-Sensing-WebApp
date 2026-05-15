'use client'

import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Line, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Keypoint } from '@/types/csi'
import { SKELETON_CONNECTIONS } from '@/types/csi'

const NODE_POSITIONS: [string, [number, number, number]][] = [
  ['A', [0.5, 0.2, -0.5]],
  ['B', [4.5, 0.2, -0.5]],
  ['C', [2.5, 0.2, -4.5]],
]

function NodeMarker({ position, label }: { position: [number, number, number]; label: string }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#1D9E75" />
      </mesh>
      <Html position={[0, 0.3, 0]} center>
        <div className="text-[11px] font-bold text-[#1D9E75] pointer-events-none select-none bg-slate-900/60 px-1.5 py-0.5 rounded">
          {label}
        </div>
      </Html>
    </group>
  )
}

function Skeleton({ keypoints }: { keypoints: Keypoint[] }) {
  const bones = useMemo(() => {
    return SKELETON_CONNECTIONS.map(([i, j]) => {
      if (!keypoints[i] || !keypoints[j]) return null
      const a = keypoints[i]
      const b = keypoints[j]
      // Coordinate mapping: room (x, y_fwd, z_up) → Three.js (x, z_up, -y_fwd)
      const start = new THREE.Vector3(a.x, a.z, -a.y)
      const end = new THREE.Vector3(b.x, b.z, -b.y)
      return { start, end, key: `${i}-${j}` }
    }).filter(Boolean)
  }, [keypoints])

  return (
    <group>
      {/* Joints */}
      {keypoints.map((kp, i) => (
        <mesh key={i} position={[kp.x, kp.z, -kp.y]}>
          <sphereGeometry args={[kp.confidence > 0.88 ? 0.055 : 0.04, 12, 12]} />
          <meshStandardMaterial
            color={kp.confidence > 0.88 ? '#60a5fa' : '#94a3b8'}
            emissive={kp.confidence > 0.88 ? '#1d4ed8' : '#000'}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* Bones */}
      {bones.map(b => b && (
        <Line
          key={b.key}
          points={[b.start, b.end]}
          color="#185FA5"
          lineWidth={2.5}
        />
      ))}
    </group>
  )
}

function RoomBounds() {
  const edges = useMemo(() => {
    // 5×5 room boundary at floor
    const pts: THREE.Vector3[] = []
    const corners = [[0,0],[5,0],[5,-5],[0,-5]] as [number,number][]
    corners.forEach(([x, z], i) => {
      const next = corners[(i+1) % 4]
      pts.push(new THREE.Vector3(x, 0, z), new THREE.Vector3(next[0], 0, next[1]))
    })
    return pts
  }, [])

  return (
    <Line
      points={edges.reduce<THREE.Vector3[][]>((acc, _, i) =>
        i % 2 === 0 ? [...acc, [edges[i], edges[i+1]]] : acc, []
      ).flat()}
      color="#334155"
      lineWidth={1}
    />
  )
}

interface Props {
  keypoints: Keypoint[] | undefined
}

export default function PoseView3D({ keypoints }: Props) {
  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [7, 6, 7], fov: 50, near: 0.1, far: 100 }}
        style={{ background: '#0a0e1a' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.7} />
        <pointLight position={[5, 8, 5]} intensity={1.0} color="#ffffff" />
        <pointLight position={[0, 8, 0]} intensity={0.3} color="#a5f3fc" />

        {/* Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          minDistance={3}
          maxDistance={18}
          target={[2.5, 0.9, -2.5]}
        />

        {/* Floor grid — centered at (2.5, 0, -2.5) for 5×5 room */}
        <Grid
          args={[5, 5]}
          cellSize={0.5}
          cellThickness={0.4}
          cellColor="#1e293b"
          sectionSize={1}
          sectionThickness={0.8}
          sectionColor="#1D9E75"
          fadeDistance={20}
          fadeStrength={1}
          followCamera={false}
          position={[2.5, 0, -2.5]}
        />

        {/* Room boundary */}
        <RoomBounds />

        {/* ESP32 nodes */}
        {NODE_POSITIONS.map(([label, pos]) => (
          <NodeMarker key={label} position={pos} label={`Node ${label}`} />
        ))}

        {/* Skeleton */}
        {keypoints && keypoints.length === 17 && (
          <Skeleton keypoints={keypoints} />
        )}

        {/* Person placeholder when no keypoints */}
        {(!keypoints || keypoints.length !== 17) && (
          <mesh position={[2.5, 0.875, -2.5]}>
            <cylinderGeometry args={[0.25, 0.25, 1.75, 16]} />
            <meshStandardMaterial color="#185FA5" transparent opacity={0.2} />
          </mesh>
        )}
      </Canvas>
    </div>
  )
}
