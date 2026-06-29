'use client';

import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ROOMS, WALL_HEIGHT, WALL_THICKNESS, getOuterWalls } from './roomLayout';


// ---- Material palette: warm "reality-TV set" rather than flat brown-everywhere ----
const PALETTE = {
  wallWarm: '#c9a876',      // clay/taupe interior walls
  wallExterior: '#9c8462',  // slightly deeper tone for the building shell
  floorWood: '#a87749',     // honey oak
  floorTile: '#d8d2c4',     // warm off-white tile
  floorWalnut: '#3e2a1f',   // dark walnut — signals "different space" (diary room)
  floorDeck: '#8a6a4a',     // outdoor decking
  ceiling: '#e8dfd0',
  trim: '#5c4632',
  fabricAccent: '#a8554a',  // desaturated terracotta instead of pure red
  fabricAccent2: '#3f5a52', // muted sage, secondary furniture accent
};

const FLOOR_COLORS = {
  wood: PALETTE.floorWood,
  tile: PALETTE.floorTile,
  walnut: PALETTE.floorWalnut,
  deck: PALETTE.floorDeck,
};

function RoomFloor({ room }) {
  const { center, size, floor, isOutdoor } = room;
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[center.x, isOutdoor ? -0.02 : 0, center.z]}
      receiveShadow
    >
      <planeGeometry args={[size.width, size.depth]} />
      <meshStandardMaterial
        color={FLOOR_COLORS[floor] || PALETTE.floorWood}
        roughness={isOutdoor ? 0.95 : 0.75}
        metalness={0}
      />
    </mesh>
  );
}

// A single wall segment along X or Z axis.
function Wall({ x, z, length, axis = 'x', height = WALL_HEIGHT, color = PALETTE.wallWarm, opacity = 1, y = WALL_HEIGHT / 2 }) {
  const rotationY = axis === 'x' ? 0 : Math.PI / 2;
  return (
    <mesh position={[x, y, z]} rotation={[0, rotationY, 0]} castShadow receiveShadow>
      <boxGeometry args={[length, height, WALL_THICKNESS]} />
      <meshStandardMaterial color={color} roughness={0.9} metalness={0} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

// Glass booth for the diary room — the signature architectural element.
// Visible from outside, glows warmly at night via an internal point light.
function DiaryBooth({ room, isOccupied, timeOfDay }) {
  const { center, size } = room;
  const halfW = size.width / 2;
  const halfD = size.depth / 2;
  const glowIntensity = timeOfDay === 'night' ? (isOccupied ? 1.4 : 0.7) : (isOccupied ? 0.6 : 0.15);

  return (
    <group>
      {/* Glass walls — physical material with transmission for a real glass look */}
      <mesh position={[center.x, WALL_HEIGHT / 2, center.z - halfD]} castShadow>
        <boxGeometry args={[size.width, WALL_HEIGHT, 0.08]} />
        <meshPhysicalMaterial color="#cfe8e6" transmission={0.85} roughness={0.05} thickness={0.3} ior={1.3} />
      </mesh>
      <mesh position={[center.x - halfW, WALL_HEIGHT / 2, center.z]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[size.depth, WALL_HEIGHT, 0.08]} />
        <meshPhysicalMaterial color="#cfe8e6" transmission={0.85} roughness={0.05} thickness={0.3} ior={1.3} />
      </mesh>
      <mesh position={[center.x + halfW, WALL_HEIGHT / 2, center.z]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[size.depth, WALL_HEIGHT, 0.08]} />
        <meshPhysicalMaterial color="#cfe8e6" transmission={0.85} roughness={0.05} thickness={0.3} ior={1.3} />
      </mesh>

      {/* Thin window mullions for structure */}
      {[-1, 0, 1].map(i => (
        <mesh key={`mullion-${i}`} position={[center.x + i * (size.width / 3), WALL_HEIGHT / 2, center.z - halfD]}>
          <boxGeometry args={[0.05, WALL_HEIGHT, 0.1]} />
          <meshStandardMaterial color={PALETTE.trim} />
        </mesh>
      ))}

      {/* Walnut floor, slightly inset */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center.x, 0.01, center.z]}>
        <planeGeometry args={[size.width - 0.2, size.depth - 0.2]} />
        <meshStandardMaterial color={PALETTE.floorWalnut} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Diary chair + small desk */}
      <group position={[center.x, 0, center.z]}>
        <mesh position={[0, 0.45, 0.6]} castShadow>
          <boxGeometry args={[0.55, 0.9, 0.55]} />
          <meshStandardMaterial color={PALETTE.trim} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.85, 0.35]}>
          <boxGeometry args={[0.5, 0.5, 0.1]} />
          <meshStandardMaterial color="#2a1f17" roughness={0.5} />
        </mesh>
      </group>

      {/* The glow — this is what makes the booth read as "lit from within"
          across the whole house, especially at night */}
      <pointLight
        position={[center.x, 2.2, center.z]}
        color="#ffd9a0"
        intensity={glowIntensity}
        distance={9}
        decay={2}
      />
      {isOccupied && (
        <mesh position={[center.x, 3.5, center.z + halfD - 0.3]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#ff3333" emissive="#ff0000" emissiveIntensity={1} />
        </mesh>
      )}
    </group>
  );
}

function Furniture() {
  return (
    <group>
      {/* Living room — sofa */}
      <group position={[3, 0, 1]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[3.2, 0.7, 1.4]} />
          <meshStandardMaterial color={PALETTE.fabricAccent} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.85, -0.55]} castShadow>
          <boxGeometry args={[3.2, 0.6, 0.25]} />
          <meshStandardMaterial color={PALETTE.fabricAccent} roughness={0.85} />
        </mesh>
      </group>
      {/* Coffee table */}
      <mesh position={[3, 0.22, 2.4]} castShadow>
        <boxGeometry args={[1.4, 0.08, 0.8]} />
        <meshStandardMaterial color={PALETTE.trim} roughness={0.5} />
      </mesh>
      <mesh position={[3, 0.1, 2.4]}>
        <cylinderGeometry args={[0.06, 0.06, 0.2, 8]} />
        <meshStandardMaterial color={PALETTE.trim} />
      </mesh>

      {/* TV unit */}
      <mesh position={[7.7, 1.2, 0]} castShadow>
        <boxGeometry args={[0.1, 1.4, 2.4]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
      </mesh>

      {/* Kitchen counter (L-shape, two segments) */}
      <mesh position={[-2, 0.45, -2]} castShadow>
        <boxGeometry args={[5.5, 0.9, 0.6]} />
        <meshStandardMaterial color="#e8e2d6" roughness={0.4} />
      </mesh>
      <mesh position={[-2, 0.92, -2]}>
        <boxGeometry args={[5.5, 0.04, 0.65]} />
        <meshStandardMaterial color={PALETTE.trim} roughness={0.3} />
      </mesh>
      <mesh position={[-6, 0.45, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[4, 0.9, 0.6]} />
        <meshStandardMaterial color="#e8e2d6" roughness={0.4} />
      </mesh>

      {/* Dining table + 4 chairs */}
      <mesh position={[-2.5, 0.5, 1.8]} castShadow>
        <boxGeometry args={[2.2, 0.06, 1.3]} />
        <meshStandardMaterial color={PALETTE.floorWood} roughness={0.4} />
      </mesh>
      <mesh position={[-2.5, 0.25, 1.8]}>
        <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
        <meshStandardMaterial color={PALETTE.trim} />
      </mesh>
      {[[-1.1, 1.2], [-3.9, 1.2], [-1.1, 2.4], [-3.9, 2.4]].map(([x, z], i) => (
        <mesh key={`diningchair-${i}`} position={[x, 0.25, z]} castShadow>
          <boxGeometry args={[0.4, 0.5, 0.4]} />
          <meshStandardMaterial color={PALETTE.fabricAccent2} roughness={0.8} />
        </mesh>
      ))}

      {/* Bedroom — two beds */}
      {[-7, -3].map((x, i) => (
        <group key={`bed-${i}`} position={[x, 0, -6]}>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[1.6, 0.3, 2.2]} />
            <meshStandardMaterial color={PALETTE.trim} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <boxGeometry args={[1.5, 0.18, 2.1]} />
            <meshStandardMaterial color="#f2ede3" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.55, -0.85]}>
            <boxGeometry args={[1.3, 0.15, 0.45]} />
            <meshStandardMaterial color={i === 0 ? PALETTE.fabricAccent : PALETTE.fabricAccent2} roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* Bathroom fixtures */}
      <mesh position={[0.5, 0.4, -6]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.6, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[-0.8, 0.45, -7]} castShadow>
        <boxGeometry args={[0.7, 0.1, 0.5]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      <mesh position={[-0.8, 1.1, -7.4]}>
        <planeGeometry args={[0.6, 0.7]} />
        <meshStandardMaterial color="#dfeaea" metalness={0.6} roughness={0.15} />
      </mesh>

      {/* Backyard — patio table + a couple of loungers */}
      <mesh position={[0, 0.4, 6]} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.06, 16]} />
        <meshStandardMaterial color={PALETTE.trim} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.2, 6]}>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      {[-5, 5].map((x, i) => (
        <mesh key={`lounger-${i}`} position={[x, 0.18, 7]} rotation={[0, i === 0 ? 0.1 : -0.1, 0]} castShadow>
          <boxGeometry args={[0.6, 0.15, 1.8]} />
          <meshStandardMaterial color={PALETTE.fabricAccent2} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// Builds the exterior shell + interior partition walls from ROOMS config.
// Doors are simply gaps left in the partition walls (no geometry needed there).
function HouseShell() {
  const { minX, maxX, minZ, maxZ } = getOuterWalls();
  const shellWidth = maxX - minX;
  const shellDepth = maxZ - minZ;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;

  return (
    <group>
      {/* Floors per room */}
      {Object.entries(ROOMS).map(([key, room]) =>
        room.isGlassBooth ? null : <RoomFloor key={key} room={room} />
      )}

      {/* Ceiling (skip over the glass booth + outdoor area so light can reach them) */}
      <mesh position={[cx - 2, WALL_HEIGHT, cz - 5.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[shellWidth - 5, 10]} />
        <meshStandardMaterial color={PALETTE.ceiling} roughness={0.95} />
      </mesh>

      {/* Exterior shell walls (skip the back/yard-facing side so the yard reads as open-air) */}
      <Wall x={cx} z={minZ - 5} length={shellWidth - 5} axis="x" color={PALETTE.wallExterior} />
      <Wall x={minX} z={cz - 5.5} length={shellDepth - 5} axis="z" color={PALETTE.wallExterior} />
      <Wall x={maxX - 5} z={cz - 5.5} length={shellDepth - 5} axis="z" color={PALETTE.wallExterior} />

      {/* Interior partitions, with door gaps left as intentional breaks */}
      {/* Bedroom / Bathroom divider */}
      <Wall x={-2} z={-7.4} length={5} axis="z" color={PALETTE.wallWarm} />
      {/* Bathroom / Diary booth divider (solid, since booth's own glass starts here) */}
      <Wall x={2} z={-6.5} length={3} axis="z" color={PALETTE.wallWarm} />
      {/* Bedroom+Bathroom block / Kitchen+Living divider, with a doorway gap left open */}
      <Wall x={-6.5} z={-2.5} length={5} axis="x" color={PALETTE.wallWarm} />
      <Wall x={2.5} z={-2.5} length={4} axis="x" color={PALETTE.wallWarm} />
      {/* Kitchen / Living room soft divider (half-wall, like a breakfast bar) */}
      <Wall x={0.5} z={0} length={5} axis="z" height={1.1} y={0.55} color={PALETTE.trim} />
    </group>
  );
}

export default function House({ timeOfDay = 'day', occupants = {}, children = null }) {
  const isDiaryOccupied = (occupants.diary_room || []).length > 0;

  const getLighting = (time) => {
    switch (time) {
      case 'day':
        return { ambient: 0.55, directional: { intensity: 1.0, color: '#fff3e0' }, fog: { color: '#cfe0ea', near: 14, far: 32 } };
      case 'evening':
        return { ambient: 0.32, directional: { intensity: 0.55, color: '#ffab73' }, fog: { color: '#caa07a', near: 13, far: 28 } };
      case 'night':
        return { ambient: 0.14, directional: { intensity: 0.12, color: '#5566aa' }, fog: { color: '#0d0f22', near: 12, far: 26 } };
      default:
        return { ambient: 0.5, directional: { intensity: 0.8, color: '#ffffff' }, fog: { color: '#ffffff', near: 10, far: 30 } };
    }
  };
  const lighting = getLighting(timeOfDay);
  const skyColors = { day: '#a8cbe0', evening: '#e0926a', night: '#10122a' };

  return (
    <Canvas
      camera={{ position: [12, 13, 14], fov: 32, near: 0.1, far: 120 }}
      style={{ height: '100%', width: '100%' }}
      shadows
      gl={{ toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={[skyColors[timeOfDay]]} />
      <ambientLight intensity={lighting.ambient} />
      <directionalLight
        position={[10, 16, 6]}
        intensity={lighting.directional.intensity}
        color={lighting.directional.color}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-left={-12}
        shadow-camera-right={12}
      />
      <pointLight position={[-6, 6, -3]} intensity={0.25} distance={14} decay={2} color="#fff0d8" />
      <pointLight position={[5, 5, 4]} intensity={0.2} distance={14} decay={2} color="#fff0d8" />

      <HouseShell />
      <Furniture />
      <DiaryBooth room={ROOMS.diary_room} isOccupied={isDiaryOccupied} timeOfDay={timeOfDay} />

      {children}

      <OrbitControls
        enableDamping
        enableZoom
        enablePan
        maxDistance={28}
        minDistance={5}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.5}
        panSpeed={0.5}
      />

      <fog attach="fog" args={[lighting.fog.color, lighting.fog.near, lighting.fog.far]} />
    </Canvas>
  );
}