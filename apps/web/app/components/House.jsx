import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function House() {
  return (
    <Canvas camera={{ position: [10, 10, 10], fov: 25 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />
      
      {/* Ground */}
      <mesh receiveShadow>
        <planeGeometry args={[20, 20]} rotation={[ - Math.PI / 2, 0, 0 ]} />
        <meshStandardMaterial color="#75a676" />
      </mesh>
      
      {/* Simple house structure */}
      <group>
        {/* Walls */}
        <mesh>
          <boxGeometry args={[8, 4, 8]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        
        {/* Roof */}
        <mesh position={[0, 2, 0]}>
          <coneRadius={5} height={3} radialSegments={4} />
          <meshStandardMaterial color="#8B0000" />
        </mesh>
        
        {/* Door */}
        <mesh position={[0, 0, 3.99]}>
          <boxGeometry args={[2, 3, 0.1]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
        
        {/* Windows */}
        <mesh position={[-2, 1, 3.99]}>
          <boxGeometry args={[1.5, 1.5, 0.1]} />
          <meshStandardMaterial color="#87CEEB" />
        </mesh>
        <mesh position={[2, 1, 3.99]}>
          <boxGeometry args={[1.5, 1.5, 0.1]} />
          <meshStandardMaterial color="#87CEEB" />
        </mesh>
      </group>
      
      <OrbitControls />
      <gridHelper args={[20, 20]} args2={[0x888888, 0x444444]} />
      <axesHelper args={[5]} />
    </Canvas>
  );
}

export default House;
