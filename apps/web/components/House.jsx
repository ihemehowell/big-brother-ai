'use client';

import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useState } from 'react';
import Avatar from '@/components/avatars/Avatar';
import { useWebSocket } from '@/lib/useWebSocket';

export default function House() {
  const { contestants, isConnected, messages } = useWebSocket();
  const contestantsArray = Object.values(contestants);

  // State for day/time display
  const [currentTime, setCurrentTime] = useState(null);
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simple room definitions for the 3D house
  const rooms = [
    // Living Room
    { id: 'living', position: [-3, 0, -3], size: [6, 2.5, 6], color: 0x8b4513 },
    // Kitchen
    { id: 'kitchen', position: [3, 0, -3], size: [4, 2.5, 4], color: 0x8b4513 },
    // Bedroom 1
    { id: 'bedroom1', position: [-3, 0, 3], size: [4, 2.5, 4], color: 0x8b4513 },
    // Bedroom 2
    { id: 'bedroom2', position: [3, 0, 3], size: [4, 2.5, 4], color: 0x8b4513 },
  ];

  // Simple furniture
  const furniture = [
    // Sofa in living room
    { id: 'sofa', position: [-2, 0.1, -2], size: [2, 0.5, 1.5], color: 0x8b0000 },
    // Coffee table
    { id: 'coffee-table', position: [-2, 0.3, -2], size: [1, 0.1, 1], color: 0xcd853f },
    // Kitchen counter
    { id: 'counter', position: [3, 0.5, -2], size: [2, 1, 2], color: 0xdeb887 },
    // Bed in bedroom 1
    { id: 'bed1', position: [-3, 0.5, 2], size: [1.5, 1, 2], color: 0xffb6c1 },
    // Bed in bedroom 2
    { id: 'bed2', position: [3, 0.5, 2], size: [1.5, 1, 2], color: 0xadd8e6 },
  ];

  const treePositions = [
    [-8, 0, -8],
    [8, 0, -8],
    [-8, 0, 8],
    [8, 0, 8],
  ];

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format day (e.g., "Day 1")
  const formatDay = (date) => {
    // For simplicity, we'll just show the date
    return `Day ${date.getDate()}`;
  };

  return (
    <div className="flex h-screen w-screen">
      {/* 3D View */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [15, 15, 15], fov: 25 }}
          style={{ height: '100%', width: '100%' }}
        >
          <OrbitControls />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 20, 10]} intensity={0.8} />

          {/* Ground plane */}
          <group>
            <mesh>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color={0x228b22} />
            </mesh>
          </group>

          {/* House foundation */}
          <group>
            <mesh>
              <boxGeometry args={[12, 0.5, 12]} />
              <meshStandardMaterial color={0x8b4513} />
            </mesh>
          </group>

          {/* House rooms */}
          <group>
            {rooms.map((room) => (
              <mesh key={room.id} position={[room.position[0], room.position[1] + 1.25, room.position[2]]}>=
                <boxGeometry args={[room.size[0], room.size[1], room.size[2]]} />
                <meshStandardMaterial color={room.color} opacity={0.8} transparent />
              </mesh>
            ))}
          </group>

          {/* House roof */}
          <group>
            <mesh position={[0, 3.5, 0]}>
              <boxGeometry args={[14, 1, 14]} />
              <meshStandardMaterial color={0x8b0000} />
            </mesh>
          </group>

          {/* Furniture */}
          <group>
            {furniture.map((item) => (
              <mesh key={item.id} position={[item.position[0], item.position[1], item.position[2]]}>=
                <boxGeometry args={[item.size[0], item.size[1], item.size[2]]} />
                <meshStandardMaterial color={item.color} />
              </mesh>
            ))}
          </group>

          {/* Trees */}
          <group>
            {treePositions.map((pos) => (
              <group key={pos.toString()} position={pos}>
                <mesh>
                  <cylinderGeometry args={[0.5, 0.5, 3]} />
                  <meshStandardMaterial color={0x228b22} />
                </mesh>
                <mesh>
                  <sphereGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color={0x228b22} />
                </mesh>
              </group>
            ))}
          </group>

          {/* Contestants (avatars) */}
          {contestantsArray.map((c) => (
            <Avatar key={c.id} contestant={c} />
          ))}
        </Canvas>
        {/* Connection status in 3D view */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded">
          Connection: {isConnected ? 'Connected' : 'Disconnected'} ({contestantsArray.length} contestants)
        </div>
      </div>

      
      <div className="w-80 bg-gray-900 text-white p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Big Brother House</h2>
          <div className="flex space-x-2">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded">
              Diary Room
            </button>
            <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">
              Vote
            </button>
          </div>
        </div>

        {/* Day/Time Display */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Show Time</h3>
          {currentTime ? (
            <div className="text-2xl font-mono">
              {formatDay(currentTime)}<br />
              {formatTime(currentTime)}
            </div>
          ) : (
            <div className="text-2xl font-mono">
              Day --<br />
              --:--
            </div>
          )}
        </div>

        {/* Mini-Map / Top-Down View */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">House Map</h3>
          <div className="relative w-full h-48 bg-gray-800 rounded">
            {/* House layout - simple top-down view */}
            <div className="absolute inset-0">
              {/* Living Room */}
              <div className="absolute left-[25%] top-[25%] w-[30%] h-[30%] bg-brown-200/50"></div>
              {/* Kitchen */}
              <div className="absolute right-[25%] top-[25%] w-[20%] h-[20%] bg-brown-200/50"></div>
              {/* Bedroom 1 */}
              <div className="absolute left-[25%] bottom-[25%] w-[20%] h-[20%] bg-brown-200/50"></div>
              {/* Bedroom 2 */}
              <div className="absolute right-[25%] bottom-[25%] w-[20%] h-[20%] bg-brown-200/50"></div>
            </div>
            {/* Contestant positions as dots */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {contestantsArray.map((contestant, index) => {
                // Simple positioning for demo - in reality, we'd map 3D position to 2D
                const angle = (index * 2 * Math.PI) / contestantsArray.length;
                const radius = 100; // pixels from center
                const x = 50 + radius * Math.cos(angle) - 4; // subtract half of dot size for centering
                const y = 50 + radius * Math.sin(angle) - 4;
                return (
                  <div
                    key={contestant.id}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: `#${((contestant.id.hashCode() || 0) & 0xFFFFFF)
                        .toString(16)
                        .padStart(6, '0')}`,
                      left: `${x}px`,
                      top: `${y}px`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* House Messages Log */}
        <div className="mb-6 flex-1">
          <h3 className="font-semibold mb-2">House Messages</h3>
          <div className="space-y-2 overflow-y-auto">
            {messages.slice(-5).map((msg, idx) => (
              <div key={idx} className="text-sm bg-gray-800/50 p-2 rounded">
                <div className="mb-1 text-gray-300">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                <div>{msg.type}</div>
              </div>
            ))}
          </div>
        </div>

        {/* House Stats Panel */}
        <div className="mt-6">
          <h3 className="font-semibold mb-2">House Stats</h3>
          <div className="space-y-2 text-sm">
            <div>Participants: {contestantsArray.length}</div>
            <div>Messages Today: {messages.length}</div>
            <div>
              Status: <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to hash a string (simple implementation)
String.prototype.hashCode = function () {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
};