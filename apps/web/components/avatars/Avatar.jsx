import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

// Local hash function — NOT a global String.prototype patch.
// Scoping this to the component avoids mutating every string in the app.
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

// Consistent per-contestant color scheme derived from their id.
function getContestantColors(id) {
  let hash = hashString(id);

  const rand = () => {
    hash = Math.sin(hash * 124.34) * 10000;
    return hash - Math.floor(hash);
  };

  const skinHue = 0.1 + rand() * 0.1;
  const skinSat = 0.1 + rand() * 0.2;
  const skinLight = 0.7 + rand() * 0.2;

  const hairHue = rand();
  const hairSat = 0.7 + rand() * 0.3;
  const hairLight = 0.3 + rand() * 0.4;

  const shirtHue = rand();
  const shirtSat = 0.8 + rand() * 0.2;
  const shirtLight = 0.4 + rand() * 0.4;

  const pantsHue = (shirtHue + 0.5) % 1.0;
  const pantsSat = 0.6 + rand() * 0.3;
  const pantsLight = 0.2 + rand() * 0.3;

  return {
    skin: `hsl(${skinHue * 360}, ${skinSat * 100}%, ${skinLight * 100}%)`,
    hair: `hsl(${hairHue * 360}, ${hairSat * 100}%, ${hairLight * 100}%)`,
    shirt: `hsl(${shirtHue * 360}, ${shirtSat * 100}%, ${shirtLight * 100}%)`,
    pants: `hsl(${pantsHue * 360}, ${pantsSat * 100}%, ${pantsLight * 100}%)`
  };
}

export default function Avatar({ contestant, isSpeaking = false }) {
  const groupRef = useRef();
  const headGroupRef = useRef();
  const mouthRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();

  const [animationState, setAnimationState] = useState('idle');

  useEffect(() => {
    if (isSpeaking) {
      setAnimationState('talking');
    } else if (contestant?.animation) {
      setAnimationState(contestant.animation);
    } else {
      setAnimationState('idle');
    }
  }, [contestant, isSpeaking]);

  // Bail out AFTER hooks are declared, so hook order stays stable across renders.
  if (!contestant) {
    return null;
  }

  const colors = getContestantColors(contestant.id);
  const pos = contestant.position || { x: 0, y: 0, z: 0 };

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (!groupRef.current) return;

    switch (animationState) {
      case 'idle':
        groupRef.current.position.y = pos.y + 0.005 * Math.abs(Math.sin(elapsed * 2));
        break;
      case 'talking':
        if (headGroupRef.current) {
          headGroupRef.current.rotation.x = -0.05 * Math.abs(Math.sin(elapsed * 4));
        }
        if (mouthRef.current) {
          mouthRef.current.scale.y = 0.5 + 0.5 * Math.abs(Math.sin(elapsed * 10));
        }
        break;
      case 'walking': {
        const walkPhase = elapsed * 4;
        if (leftLegRef.current) leftLegRef.current.rotation.x = 0.3 * Math.sin(walkPhase);
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0.3 * Math.sin(walkPhase + Math.PI);
        if (leftArmRef.current) leftArmRef.current.rotation.x = -0.3 * Math.sin(walkPhase);
        if (rightArmRef.current) rightArmRef.current.rotation.x = -0.3 * Math.sin(walkPhase + Math.PI);
        break;
      }
      case 'flirting': {
        const wavePhase = elapsed * 3;
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = 0.5 * Math.sin(wavePhase);
          rightArmRef.current.rotation.x = 0.3 * Math.abs(Math.sin(wavePhase * 0.5));
        }
        if (leftArmRef.current) {
          leftArmRef.current.rotation.x = -0.2;
        }
        break;
      }
      default:
        break;
    }
  });

  return (
    <group ref={groupRef} position={[pos.x, pos.y, pos.z]}>
      {/* Feet */}
      <mesh position={[-0.2, 0, 0]}>
        <boxGeometry args={[0.3, 0.2, 0.5]} />
        <meshStandardMaterial color={colors.pants} />
      </mesh>
      <mesh position={[0.2, 0, 0]}>
        <boxGeometry args={[0.3, 0.2, 0.5]} />
        <meshStandardMaterial color={colors.pants} />
      </mesh>

      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.2, 0.5, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 1.0]} />
        <meshStandardMaterial color={colors.pants} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.2, 0.5, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 1.0]} />
        <meshStandardMaterial color={colors.pants} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.4, 1.0, 0.3]} />
        <meshStandardMaterial color={colors.shirt} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 2.125, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.25]} />
        <meshStandardMaterial color={colors.skin} />
      </mesh>

      {/* Head group — all children below use small LOCAL offsets from this
          group's origin (0,0,0), not absolute world coordinates. The original
          version placed eyes/nose/mouth at world-scale y-values like 2.3 while
          nested inside a group already positioned at y=2.25, which would have
          rendered the face far above the actual head. */}
      <group ref={headGroupRef} position={[0, 2.25, 0]}>
        {/* Head */}
        <mesh>
          <sphereGeometry args={[0.25, 24, 24]} />
          <meshStandardMaterial color={colors.skin} />
        </mesh>

        {/* Hair */}
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshStandardMaterial color={colors.hair} />
        </mesh>

        {/* Eyes (whites + pupils), small local offsets from head center */}
        <mesh position={[-0.08, 0.03, 0.2]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.08, 0.03, 0.23]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh position={[0.08, 0.03, 0.2]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.08, 0.03, 0.23]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#000000" />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.05, 0.25]}>
          <boxGeometry args={[0.08, 0.08, 0.1]} />
          <meshStandardMaterial color={colors.skin} />
        </mesh>

        {/* Mouth */}
        <mesh ref={mouthRef} position={[0, -0.1, 0.25]} scale={[0.15, 0.5, 0.15]}>
          <boxGeometry args={[0.15, 0.1, 0.15]} />
          <meshStandardMaterial color="#aa3333" />
        </mesh>
      </group>

      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.3, 1.6, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.8]} />
        <meshStandardMaterial color={colors.shirt} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.3, 1.6, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.8]} />
        <meshStandardMaterial color={colors.shirt} />
      </mesh>

      {/* Name tag — real readable text via drei, with a backing plate for contrast */}
      <group position={[0, 2.65, 0]}>
        <mesh>
          <planeGeometry args={[0.7, 0.22]} />
          <meshBasicMaterial color="#000000" opacity={0.45} transparent />
        </mesh>
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.12}
          color="white"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {contestant.name}
        </Text>
      </group>

      {/* Speech bubble when speaking */}
      {isSpeaking && (
        <group position={[0, 2.95, 0.35]}>
          <mesh>
            {/* sphereGeometry's 2nd/3rd args are segment counts (integers >= 3),
                not dimensions — the original "0.25, 0.25" here was invalid/degenerate. */}
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial color="#ffffcc" opacity={0.9} transparent />
          </mesh>
          {/* Speech bubble tail — rotation belongs on the mesh, not in the geometry args */}
          <mesh position={[0, -0.2, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.06, 0.12, 4]} />
            <meshStandardMaterial color="#ffffcc" opacity={0.9} transparent />
          </mesh>
        </group>
      )}

      {contestant.dialogue && (
        <Text
          position={[0, 3.2, 0]}
          fontSize={0.1}
          color="#fffacc"
          anchorX="center"
          anchorY="middle"
          maxWidth={2}
          textAlign="center"
        >
          {contestant.dialogue}
        </Text>
      )}
    </group>
  );
}