# React Three.js 3D Visualization Skill

## Purpose
สำหรับสร้าง 3D visualization ด้วย Three.js ใน React application โดยเฉพาะการแสดง skeleton, pose, และ real-time 3D data

## Key Libraries
- `@react-three/fiber` — React renderer for Three.js
- `@react-three/drei` — Helper components (OrbitControls, Grid, etc.)
- `three` — Core Three.js library

## Installation
```bash
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

## Basic Setup

### 1. Canvas Container
```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'

function Scene3D() {
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        <Grid args={[10, 10]} />
        {/* Your 3D objects here */}
      </Canvas>
    </div>
  )
}
```

### 2. Creating Skeleton from Keypoints

```tsx
import { Line } from '@react-three/drei'
import * as THREE from 'three'

// COCO skeleton connections
const SKELETON_CONNECTIONS = [
  [0, 1], [0, 2],           // nose to eyes
  [1, 3], [2, 4],           // eyes to ears
  [0, 5], [0, 6],           // nose to shoulders
  [5, 7], [7, 9],           // left arm
  [6, 8], [8, 10],          // right arm
  [5, 6],                   // shoulders
  [5, 11], [6, 12],         // shoulders to hips
  [11, 12],                 // hips
  [11, 13], [13, 15],       // left leg
  [12, 14], [14, 16],       // right leg
]

interface Keypoint {
  x: number
  y: number
  z: number
  confidence: number
}

function Skeleton({ keypoints }: { keypoints: Keypoint[] }) {
  return (
    <group>
      {/* Draw joints as spheres */}
      {keypoints.map((kp, i) => (
        <mesh key={i} position={[kp.x, kp.z, -kp.y]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial 
            color={kp.confidence > 0.5 ? '#185FA5' : '#888780'} 
          />
        </mesh>
      ))}
      
      {/* Draw bones as lines */}
      {SKELETON_CONNECTIONS.map(([i, j], idx) => {
        if (!keypoints[i] || !keypoints[j]) return null
        const start = new THREE.Vector3(
          keypoints[i].x, 
          keypoints[i].z, 
          -keypoints[i].y
        )
        const end = new THREE.Vector3(
          keypoints[j].x, 
          keypoints[j].z, 
          -keypoints[j].y
        )
        return (
          <Line
            key={idx}
            points={[start, end]}
            color="#185FA5"
            lineWidth={2}
          />
        )
      })}
    </group>
  )
}
```

### 3. Animating Objects

```tsx
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

function AnimatedBox() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
    }
  })
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}
```

### 4. Grid Floor

```tsx
import { Grid } from '@react-three/drei'

function RoomFloor() {
  return (
    <Grid
      args={[5, 5]}              // 5m × 5m
      cellSize={0.5}             // 50cm cells
      cellThickness={0.5}
      cellColor="#888880"
      sectionSize={1}
      sectionThickness={1}
      sectionColor="#1D9E75"
      fadeDistance={10}
      fadeStrength={1}
      followCamera={false}
      infiniteGrid={false}
    />
  )
}
```

### 5. Person Position Marker

```tsx
function PersonMarker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Vertical line from floor */}
      <Line
        points={[[0, 0, 0], [0, position[1], 0]]}
        color="#185FA5"
        lineWidth={1}
        dashed
        dashSize={0.1}
        gapSize={0.05}
      />
      
      {/* Person indicator */}
      <mesh position={[0, position[1], 0]}>
        <cylinderGeometry args={[0.3, 0.3, 1.7, 16]} />
        <meshStandardMaterial 
          color="#185FA5" 
          transparent 
          opacity={0.3} 
        />
      </mesh>
    </group>
  )
}
```

### 6. ESP32 Node Markers

```tsx
function NodeMarker({ 
  position, 
  label 
}: { 
  position: [number, number, number]
  label: string 
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#1D9E75" />
      </mesh>
      
      {/* Label using HTML overlay (optional) */}
      <Html position={[0, 0.3, 0]} center>
        <div style={{ 
          color: '#1D9E75', 
          fontSize: '12px',
          fontWeight: 'bold',
          pointerEvents: 'none'
        }}>
          {label}
        </div>
      </Html>
    </group>
  )
}
```

## Complete 3D Scene Example

```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Html } from '@react-three/drei'
import { useState, useEffect } from 'react'

function Scene3D() {
  const [personPos, setPersonPos] = useState<[number, number, number]>([2.5, 1.2, 2.5])
  const [keypoints, setKeypoints] = useState<Keypoint[]>([])
  
  // Mock animation
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate walking
      setPersonPos(prev => [
        prev[0] + (Math.random() - 0.5) * 0.1,
        1.2,
        prev[1] + (Math.random() - 0.5) * 0.1
      ])
      
      // Update keypoints (mock)
      // In real app, this comes from CSI detection
    }, 100)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div style={{ width: '100%', height: '600px', background: '#0a0e1a' }}>
      <Canvas camera={{ position: [6, 6, 6], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 10, 5]} intensity={0.8} />
        
        {/* Controls */}
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={15}
        />
        
        {/* Floor grid */}
        <Grid
          args={[5, 5]}
          cellSize={0.5}
          sectionSize={1}
          cellColor="#334155"
          sectionColor="#1D9E75"
          position={[2.5, 0, 2.5]}
        />
        
        {/* ESP32 Nodes */}
        <NodeMarker position={[0.5, 0.2, 0.5]} label="A" />
        <NodeMarker position={[4.5, 0.2, 0.5]} label="B" />
        <NodeMarker position={[2.5, 0.2, 4.5]} label="C" />
        
        {/* Person */}
        <PersonMarker position={personPos} />
        {keypoints.length === 17 && <Skeleton keypoints={keypoints} />}
        
        {/* Room boundaries */}
        <lineSegments>
          <edgesGeometry 
            attach="geometry" 
            args={[new THREE.BoxGeometry(5, 2.5, 5)]} 
          />
          <lineBasicMaterial attach="material" color="#64748b" />
        </lineSegments>
      </Canvas>
    </div>
  )
}
```

## Performance Tips

1. **Use `useMemo` for static geometry**
```tsx
const geometry = useMemo(() => new THREE.SphereGeometry(0.1, 16, 16), [])
```

2. **Limit `useFrame` updates**
```tsx
useFrame((state, delta) => {
  if (delta > 0.05) return // Skip if frame took too long
  // Update logic
})
```

3. **Use instancing for multiple similar objects**
```tsx
import { Instances, Instance } from '@react-three/drei'

<Instances>
  <sphereGeometry args={[0.05]} />
  <meshStandardMaterial color="blue" />
  {keypoints.map((kp, i) => (
    <Instance key={i} position={[kp.x, kp.z, -kp.y]} />
  ))}
</Instances>
```

4. **Reduce shadow complexity**
- Use fewer lights with shadows
- Lower shadow map resolution if needed

## Common Gotchas

1. **Coordinate system**: Three.js uses Y-up, but WiFi sensing might use Z-up
   - Convert: `[x, z, -y]` or adjust camera
   
2. **Scale**: ESP32 outputs meters, Three.js default scale is arbitrary
   - Keep 1 unit = 1 meter for clarity
   
3. **React strict mode**: `<Canvas>` might render twice in dev
   - Normal behavior, doesn't affect production

4. **Types**: Import types correctly
```tsx
import * as THREE from 'three'
import type { Mesh } from 'three'
const ref = useRef<THREE.Mesh>(null)
```

## Resources
- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Drei Components](https://github.com/pmndrs/drei)
- [Three.js Examples](https://threejs.org/examples/)
