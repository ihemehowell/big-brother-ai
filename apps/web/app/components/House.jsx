'use client';

import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useState, useEffect } from 'react';

// Simplified, more visible avatar component
function Avatar({ position, color, name, isTalking = false }) {
  const [bob, setBob] = useState(0);
  const [pulse, setPulse] = useState(1);

  // Gentle floating animation
  useEffect(() => {
    const timer = setInterval(() => {
      setBob(Math.sin(Date.now() * 0.0015) * 0.03);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Talking pulse effect
  useEffect(() => {
    if (isTalking) {
      const timer = setInterval(() => {
        setPulse(p => (p === 1 ? 1.15 : 1));
      }, 200);
      return () => clearInterval(timer);
    }
    setPulse(1);
  }, [isTalking]);

  return (
    <group
      position={[position[0], position[1] + 0.5 + bob, position[2]]}
      scale={[pulse, pulse, pulse]}
    >
      {/* Drop shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <circleGeometry args={[0.18, 8]} />
        <meshBasicMaterial color={0x000000} opacity={0.2} transparent />
      </mesh>

      {/* Body - simple capsule but more visible */}
      <mesh>
        <capsuleGeometry args={[0.16, 0.6, 4, 6]} />
        <meshStandardMaterial color={color} metalness={0.0} roughness={0.9} />
      </mesh>

      {/* Head - slightly larger for visibility */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Name tag - background plane + drei Text for actual readable text */}
      <group position={[0, 0.75, 0]}>
        <mesh>
          <planeGeometry args={[0.5, 0.15]} />
          <meshBasicMaterial color={0x000000} opacity={0.4} transparent />
        </mesh>
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {name}
        </Text>
      </group>

      {/* Talking indicator - more visible */}
      {isTalking && (
        <mesh position={[0, 0.5, 0.25]}>
          <sphereGeometry args={[0.09, 6, 6]} />
          <meshStandardMaterial
            color="#ff4444"
            emissive={0xffffff}
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}

export default function House() {
  const [timeOfDay, setTimeOfDay] = useState('day');
  const [avatars, setAvatars] = useState([]);
  const [roomState, setRoomState] = useState({
    livingRoom: ['Alex', 'Sam'],
    kitchen: ['Jamie', 'Taylor'],
    bedroom: ['Casey', 'Morgan'],
    bathroom: [],
    diaryRoom: [],
    yard: []
  });

  // Simulate time of day changes and occasional room changes
  useEffect(() => {
    // Time of day cycle (slower for better viewing)
    const timeInterval = setInterval(() => {
      setTimeOfDay(prev => {
        const times = ['day', 'evening', 'night'];
        const currentIndex = times.indexOf(prev);
        const nextIndex = (currentIndex + 1) % times.length;
        return times[nextIndex];
      });
    }, 180000); // 3 minutes

    // Occasionally shuffle people between rooms
    const roomInterval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance to shuffle
        const allPeople = ['Alex', 'Sam', 'Jamie', 'Taylor', 'Casey', 'Morgan'];
        const rooms = ['livingRoom', 'kitchen', 'bedroom', 'bathroom', 'diaryRoom', 'yard'];

        // Clear all rooms
        const newState = {};
        rooms.forEach(room => {
          newState[room] = [];
        });

        // Distribute people randomly
        allPeople.forEach(person => {
          const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
          newState[randomRoom].push(person);
        });

        setRoomState(newState);
      }
    }, 10000); // Every 10 seconds

    return () => {
      clearInterval(timeInterval);
      clearInterval(roomInterval);
    };
  }, []);

  // Update avatar positions based on room state
  useEffect(() => {
    const avatarUpdateInterval = setInterval(() => {
      const roomPositions = {
        livingRoom: [{ x: -3, z: 2 }, { x: 3, z: 2 }],
        kitchen: [{ x: 4, z: -2 }, { x: 4, z: 2 }],
        bedroom: [{ x: -2, z: -3 }, { x: 2, z: -3 }],
        bathroom: [{ x: 5, z: 3 }],
        diaryRoom: [{ x: -4, z: 3 }],
        yard: [{ x: -4, z: -4 }, { x: 4, z: -4 }]
      };

      const colors = {
        Alex: '#3b82f6',
        Sam: '#10b981',
        Jamie: '#f59e0b',
        Taylor: '#8b5cf6',
        Casey: '#ec4899',
        Morgan: '#14b8a6'
      };

      const newAvatars = [];
      Object.entries(roomState).forEach(([room, people]) => {
        people.forEach((person, index) => {
          const positions = roomPositions[room] || [{ x: 0, z: 0 }];
          const pos = positions[index] || positions[0];
          newAvatars.push({
            id: person.toLowerCase(),
            position: [pos.x, 0, pos.z],
            color: colors[person] || '#888888',
            name: person,
            talking: Math.random() > 0.8
          });
        });
      });

      setAvatars(newAvatars);
    }, 2000);

    return () => clearInterval(avatarUpdateInterval);
  }, [roomState]);

  // Lighting configuration for different times of day
  const getLighting = (time) => {
    switch (time) {
      case 'day':
        return {
          ambient: 0.85,
          directional: { intensity: 0.85, color: '#fff8ec' },
          fog: { color: '#bfd9ec', near: 10, far: 25 }
        };
      case 'evening':
        return {
          ambient: 0.4,
          directional: { intensity: 0.6, color: '#ffaa88' },
          fog: { color: '#e08a5e', near: 12, far: 28 }
        };
      case 'night':
        return {
          ambient: 0.2,
          directional: { intensity: 0.2, color: '#4444aa' },
          fog: { color: '#101030', near: 15, far: 30 }
        };
      default:
        return {
          ambient: 0.5,
          directional: { intensity: 0.8, color: '#ffffff' },
          fog: { color: '#ffffff', near: 5, far: 50 }
        };
    }
  };

  const lighting = getLighting(timeOfDay);

  const skyColors = {
    day: '#87ceeb',
    evening: '#ff8c69',
    night: '#191970'
  };

  // Dining chair positions: 4 chairs around a 5x3 table centered at (0, 0.6, -1)
  const chairPositions = [
    { x: -1.5, z: -2.5 },
    { x: 1.5, z: -2.5 },
    { x: -1.5, z: 0.5 },
    { x: 1.5, z: 0.5 }
  ];

  return (
    <Canvas
      camera={{
        position: [10, 12, 12],
        fov: 28,
        near: 0.1,
        far: 100
      }}
      style={{ height: '100%', width: '100%' }}
      shadows
      gl={{ toneMapping: THREE.ACESFilmicToneMapping }}
    >
      {/* Sky/background color based on time of day */}
      <color attach="background" args={[skyColors[timeOfDay]]} />

      {/* Ambient light with slight tint for time of day */}
      <ambientLight intensity={lighting.ambient} />

      {/* Main directional light (sun/moon) */}
      <directionalLight
        position={[8, 15, 8]}
        intensity={lighting.directional.intensity}
        color={lighting.directional.color}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-left={-10}
        shadow-camera-right={10}
      />

      {/* Fill lights for better illumination */}
      <pointLight position={[-8, 10, -8]} intensity={0.3} distance={20} decay={2} />
      <pointLight position={[8, 10, 8]} intensity={0.2} distance={20} decay={2} />

      {/* Additional rim light for character separation */}
      <directionalLight position={[-5, 20, 5]} intensity={0.3} color="#888888" />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#654321" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Walls - Proper room structure with solid walls */}
      <group>
        {/* Back wall */}
        <mesh position={[0, 2.5, -9.99]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[18, 8]} />
          <meshStandardMaterial color="#8B4513" roughness={0.95} metalness={0.0} />
        </mesh>

        {/* Left wall */}
        <mesh position={[-8.99, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[18, 8]} />
          <meshStandardMaterial color="#8B4513" roughness={0.95} metalness={0.0} />
        </mesh>

        {/* Right wall */}
        <mesh position={[8.99, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[18, 8]} />
          <meshStandardMaterial color="#8B4513" roughness={0.95} metalness={0.0} />
        </mesh>

        {/* Front wall (with window area) */}
        <mesh position={[0, 2.5, 9.99]}>
          <planeGeometry args={[18, 8]} />
          <meshStandardMaterial color="#8B4513" roughness={0.95} metalness={0.0} />
        </mesh>

        {/* Ceiling */}
        <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[18, 18]} />
          <meshStandardMaterial color="#4a3520" roughness={0.9} metalness={0.0} />
        </mesh>

        {/* Room dividers - proper walls to create distinct spaces */}
        {/* Kitchen divider - separates kitchen from living/dining area */}
        <mesh position={[0, 2.5, -2]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4, 4]} />
          <meshStandardMaterial color="#654321" roughness={0.9} />
        </mesh>

        {/* Living room divider - separates living room from bedroom area */}
        <mesh position={[-4, 2.5, 2]} rotation={[0, 0, 0]}>
          <planeGeometry args={[4, 4]} />
          <meshStandardMaterial color="#654321" roughness={0.9} />
        </mesh>

        {/* Bedroom divider - creates private bedroom area */}
        <mesh position={[3, 2.5, 2]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4, 4]} />
          <meshStandardMaterial color="#654321" roughness={0.9} />
        </mesh>

        {/* Bathroom walls - enclosed bathroom */}
        <mesh position={[5, 2.5, -2]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4, 4]} />
          <meshStandardMaterial color="#8B4513" roughness={0.9} />
        </mesh>
        <mesh position={[5, 2.5, 2]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4, 4]} />
          <meshStandardMaterial color="#8B4513" roughness={0.9} />
        </mesh>
        <mesh position={[3, 2.5, 0]} rotation={[0, 0, 0]}>
          <planeGeometry args={[4, 4]} />
          <meshStandardMaterial color="#8B4513" roughness={0.9} />
        </mesh>
        <mesh position={[7, 2.5, 0]} rotation={[0, 0, 0]}>
          <planeGeometry args={[4, 2]} />
          <meshStandardMaterial color="#8B4513" roughness={0.9} />
        </mesh>

        {/* Diary Room - private, enclosed space */}
        <mesh position={[-6, 2.5, 3]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4, 4]} />
          <meshStandardMaterial color="#8b0000" roughness={0.9} />
        </mesh>
        <mesh position={[-2, 2.5, 3]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4, 4]} />
          <meshStandardMaterial color="#8b0000" roughness={0.9} />
        </mesh>
        <mesh position={[-4, 2.5, 1]} rotation={[0, 0, 0]}>
          <planeGeometry args={[4, 2]} />
          <meshStandardMaterial color="#8b0000" roughness={0.9} />
        </mesh>
        <mesh position={[-4, 2.5, 5]} rotation={[0, 0, 0]}>
          <planeGeometry args={[4, 2]} />
          <meshStandardMaterial color="#8b0000" roughness={0.9} />
        </mesh>

        {/* Diary Room door opening (optional - could add a door frame later) */}
        {/* Leave open for now to see inside */}

        /*
           Room Layout Summary:
           - Living Room: x:-4 to 4, z:-2 to 4
           - Kitchen: x:-2 to 4, z:-4 to -2
           - Bedroom: x:2 to 6, z:-4 to -2
           - Bathroom: x:4 to 8, z:-2 to 2
           - Diary Room: x:-6 to -2, z:1 to 5
           - Yard: x:-6 to 6, z:-6 to -4 and x:-6 to 6, z:6 to 8 (L-shaped)
        */
      </group>

      {/* Furniture - More detailed and characteristic */}
      <group>
        {/* Living Room */}
        {/* Sofa */}
        <group position={[-3, 0.6, 2]}>
          {/* Base */}
          <mesh>
            <boxGeometry args={[4, 0.5, 2]} />
            <meshStandardMaterial color="#8b0000" roughness={0.9} />
          </mesh>
          {/* Cushions */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[3.8, 0.3, 1.8]} />
            <meshStandardMaterial color="#9b1c1c" roughness={0.8} />
          </mesh>
          {/* Back */}
          <mesh position={[0, 1.0, -0.9]}>
            <boxGeometry args={[4, 0.8, 0.2]} />
            <meshStandardMaterial color="#8b0000" roughness={0.9} />
          </mesh>
        </group>

        {/* Coffee table */}
        <mesh position={[-3, 0.3, 2]}>
          <boxGeometry args={[2.5, 0.2, 1.5]} />
          <meshStandardMaterial color="#654321" roughness={0.8} />
        </mesh>

        {/* TV Stand */}
        <mesh position={[4, 0.3, -4]}>
          <boxGeometry args={[3, 0.4, 1.5]} />
          <meshStandardMaterial color="#654321" roughness={0.8} />
        </mesh>
        {/* TV Screen */}
        <mesh position={[4, 0.6, -4.99]}>
          <boxGeometry args={[2.8, 1.6, 0.1]} />
          <meshBasicMaterial color="#00ffff" opacity={0.3} transparent />
        </mesh>

        {/* Kitchen */}
        {/* Counter */}
        <mesh position={[-2, 0.6, -4]}>
          <boxGeometry args={[6, 0.4, 2]} />
          <meshStandardMaterial color="#696969" roughness={0.8} />
        </mesh>
        <mesh position={[-2, 1.0, -4]}>
          <boxGeometry args={[6, 0.2, 2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>

        {/* Fridge */}
        <mesh position={[2, 0.6, -4]}>
          <boxGeometry args={[1.5, 1.2, 0.8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>

        {/* Dining Table */}
        <mesh position={[0, 0.6, -1]}>
          <boxGeometry args={[5, 0.4, 3]} />
          <meshStandardMaterial color="#8b4513" roughness={0.85} />
        </mesh>

        {/* Dining Chairs - one at each corner of the table */}
        {chairPositions.map((c, i) => (
          <group key={`chair-${i}`} position={[c.x, 0.6, c.z]}>
            <mesh>
              <boxGeometry args={[0.4, 0.5, 0.4]} />
              <meshStandardMaterial color="#654321" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.3, 0]}>
              <boxGeometry args={[0.3, 0.3, 0.3]} />
              <meshStandardMaterial color="#654321" roughness={0.8} />
            </mesh>
          </group>
        ))}

        {/* Bedroom */}
        {/* Bed */}
        <group position={[3, 0.6, 2]}>
          {/* Frame */}
          <mesh>
            <boxGeometry args={[3, 0.3, 2]} />
            <meshStandardMaterial color="#8b0000" roughness={0.9} />
          </mesh>
          {/* Mattress */}
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[2.8, 0.2, 1.8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
          {/* Pillow */}
          <mesh position={[0, 0.4, -0.8]}>
            <boxGeometry args={[0.8, 0.2, 0.6]} />
            <meshStandardMaterial color="#ffffcc" roughness={0.8} />
          </mesh>
        </group>

        {/* Nightstand */}
        <mesh position={[5, 0.6, 2]}>
          <boxGeometry args={[0.6, 0.4, 0.6]} />
          <meshStandardMaterial color="#654321" roughness={0.8} />
        </mesh>
        <mesh position={[5, 1.0, 2]}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>

        {/* Bathroom */}
        {/* Toilet */}
        <group position={[5, 0.6, -2]}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.3, 0.8, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.3, 0.1]}>
            <cylinderGeometry args={[0.25, 0.1, 0.8, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.15, 0.3]}>
            <boxGeometry args={[0.3, 0.3, 0.1]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
        </group>

        {/* Sink */}
        <mesh position={[5, 0.6, -3]}>
          <cylinderGeometry args={[0.25, 0.3, 0.6, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
        <mesh position={[5, 0.9, -3]}>
          <boxGeometry args={[0.5, 0.1, 0.3]} />
          <meshStandardMaterial color="#654321" roughness={0.8} />
        </mesh>

        {/* Mirror */}
        <mesh position={[5, 1.2, -3.01]}>
          <planeGeometry args={[0.6, 0.4]} />
          <meshStandardMaterial color="#cccccc" metalness={0.8} roughness={0.1} />
        </mesh>

        {/* Diary Room Furnishings */}
        <group position={[-4, 0.6, 3]}>
          {/* Diary Chair */}
          <mesh>
            <boxGeometry args={[0.5, 0.8, 0.5]} />
            <meshStandardMaterial color="#4a3520" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color="#654321" roughness={0.8} />
          </mesh>

          {/* Diary Table/Desk */}
          <mesh position={[0, 0.6, -0.3]}>
            <boxGeometry args={[1.0, 0.3, 0.6]} />
            <meshStandardMaterial color="#654321" roughness={0.8} />
          </mesh>

          {/* Diary Camera Indicator (red light) */}
          <mesh position={[0, 1.2, 0.3]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color="#ff0000" emissive={0xff0000} emissiveIntensity={0.5} />
          </mesh>
        </group>
      </group>

      {/* Decorative elements to make it feel lived-in */}
      <group>
        {/* Rug */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[3, 2]} />
          <meshStandardMaterial color="#8b4513" roughness={0.9} />
        </mesh>

        {/* Picture on wall */}
        <mesh position={[0, 3.5, 9.991]}>
          <planeGeometry args={[1.5, 1]} />
          <meshStandardMaterial color="#654321" roughness={0.9} />
        </mesh>
        <mesh position={[0, 3.5, 9.992]}>
          <planeGeometry args={[1.4, 0.9]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>

        {/* Plant in corner */}
        <group position={[-6, 0.2, -6]}>
          {/* Pot */}
          <mesh>
            <cylinderGeometry args={[0.2, 0.2, 0.3, 8]} />
            <meshStandardMaterial color="#654321" roughness={0.9} />
          </mesh>
          {/* Plant */}
          <mesh position={[0, 0.2, 0]}>
            <coneGeometry args={[0.15, 0.3, 8]} />
            <meshStandardMaterial color="#228b22" roughness={0.9} />
          </mesh>
        </group>

        {/* Yard decorations */}
        <group position={[-4, 0.1, -4]}>
          {/* Small tree/bush */}
          <mesh>
            <coneGeometry args={[0.3, 0.8, 8]} />
            <meshStandardMaterial color="#228b22" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
            <meshStandardMaterial color="#654321" roughness={0.9} />
          </mesh>
        </group>
        <group position={[4, 0.1, -4]}>
          {/* Garden gnome */}
          <mesh>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color="#ffd700" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <coneGeometry args={[0.1, 0.3, 8]} />
            <meshStandardMaterial color="#8b4513" roughness={0.9} />
          </mesh>
        </group>
      </group>

      {/* Avatars - Much more visible now */}
      {avatars.map(avatar => (
        <Avatar
          key={avatar.id}
          position={avatar.position}
          color={avatar.color}
          name={avatar.name}
          isTalking={avatar.talking}
        />
      ))}

      {/* Controls */}
      <OrbitControls
        enableDamping={true}
        enableZoom={true}
        enablePan={true}
        maxDistance={25}
        minDistance={4}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.5}
        panSpeed={0.5}
      />

      {/* Optional helpers - uncomment for debugging */}
      {/* <gridHelper args={[20, 20, 0x888888, 0x444444]} /> */}
      {/* <axesHelper args={[5]} /> */}

      {/* Fog for depth perception */}
      <fog attach="fog" args={[lighting.fog.color, lighting.fog.near, lighting.fog.far]} />
    </Canvas>
  );
}