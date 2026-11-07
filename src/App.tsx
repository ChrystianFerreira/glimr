import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'

function SpinningBox() {
  const meshRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.rotation.x += delta
    mesh.rotation.y += delta * 0.7
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry />
      <meshNormalMaterial />
    </mesh>
  )
}

function App() {
  return (
    <Canvas camera={{ position: [0, 0, 3] }}>
      <SpinningBox />
    </Canvas>
  )
}

export default App
