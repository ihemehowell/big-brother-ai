import * as THREE from 'three';
import { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// Simple 3D avatar representation with improved humanoid features
const Avatar = ({ contestant, isSpeaking = false }) => {
  const groupRef = useRef();
  const headGroupRef = useRef();
  const mouthRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();

  // Handle case where contestant data is not yet available
  if (!contestant) {
    return null;
  }

  const [animationState, setAnimationState] = useState('idle');

  // Update animation state based on contestant data and speaking state
  useEffect(() => {
    if (isSpeaking) {
      setAnimationState('talking');
    } else if (contestant?.state) {
      setAnimationState(contestant.state);
    } else {
      setAnimationState('idle');
    }
  }, [contestant, isSpeaking]);

  // Get consistent color scheme for each contestant
  const getContestantColors = (id) => {
    // Simple hash function to generate consistent values
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate multiple colors from the hash
    const rand = () => {
      hash = Math.sin(hash * 124.34) * 10000;
      return hash - Math.floor(hash);
    };

    // Skin tone range (lighter to medium)
    const skinHue = 0.1 + rand() * 0.1; // 0.1 to 0.2
    const skinSat = 0.1 + rand() * 0.2; // 0.1 to 0.3
    const skinLight = 0.7 + rand() * 0.2; // 0.7 to 0.9

    // Hair color range (various colors)
    const hairHue = rand(); // 0 to 1
    const hairSat = 0.7 + rand() * 0.3; // 0.7 to 1.0
    const hairLight = 0.3 + rand() * 0.4; // 0.3 to 0.7

    // Shirt color range (bright colors for reality show)
    const shirtHue = rand(); // 0 to 1
    const shirtSat = 0.8 + rand() * 0.2; // 0.8 to 1.0
    const shirtLight = 0.4 + rand() * 0.4; // 0.4 to 0.8

    // Pants color range (darker colors)
    const pantsHue = (shirtHue + 0.5) % 1.0; // Complementary or different
    const pantsSat = 0.6 + rand() * 0.3; // 0.6 to 0.9
    const pantsLight = 0.2 + rand() * 0.3; // 0.2 to 0.5

    return {
      skin: `hsl(${skinHue * 360}, ${skinSat * 100}%, ${skinLight * 100}%)`,
      hair: `hsl(${hairHue * 360}, ${hairSat * 100}%, ${hairLight * 100}%)`,
      shirt: `hsl(${shirtHue * 360}, ${shirtSat * 100}%, ${shirtLight * 100}%)`,
      pants: `hsl(${pantsHue * 360}, ${pantsSat * 100}%, ${pantsLight * 100}%)`
    };
  };

  const colors = getContestantColors(contestant.id);

  // Animation clock
  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();

    // Apply animations based on state
    if (groupRef.current) {
      switch (animationState) {
        case 'idle':
          // Gentle breathing motion
          groupRef.current.position.y = 0.005 * Math.abs(Math.sin(elapsed * 2));
          break;
        case 'talking':
          // Head nod and mouth movement
          if (headGroupRef.current) {
            // Nodding motion
            headGroupRef.current.rotation.x = -0.05 * Math.abs(Math.sin(elapsed * 4));
          }
          if (mouthRef.current) {
            // Mouth opening/closing
            mouthRef.current.scale.y = 0.5 + 0.5 * Math.abs(Math.sin(elapsed * 10));
          }
          break;
        case 'walking':
          // Simple walking motion (legs and arms swing)
          const walkPhase = elapsed * 2;
          if (leftLegRef.current) {
            leftLegRef.current.rotation.x = 0.3 * Math.sin(walkPhase);
          }
          if (rightLegRef.current) {
            rightLegRef.current.rotation.x = 0.3 * Math.sin(walkPhase + Math.PI);
          }
          if (leftArmRef.current) {
            leftArmRef.current.rotation.x = -0.3 * Math.sin(walkPhase);
          }
          if (rightArmRef.current) {
            rightArmRef.current.rotation.x = -0.3 * Math.sin(walkPhase + Math.PI);
          }
          break;
        case 'flirting':
          // Flirty wave with right arm
          const wavePhase = elapsed * 3;
          if (rightArmRef.current) {
            rightArmRef.current.rotation.z = 0.5 * Math.sin(wavePhase);
            rightArmRef.current.rotation.x = 0.3 * Math.abs(Math.sin(wavePhase * 0.5));
          }
          // Left arm relaxed
          if (leftArmRef.current) {
            leftArmRef.current.rotation.x = -0.2;
          }
          break;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Feet */}
      <group>
        {/* Left foot */}
        <mesh position={[-0.2, 0, 0]}>
          <boxGeometry args={[0.3, 0.2, 0.5]} />
          <meshStandardMaterial color={colors.pants} />
        </mesh>
        {/* Right foot */}
        <mesh position={[0.2, 0, 0]}>
          <boxGeometry args={[0.3, 0.2, 0.5]} />
          <meshStandardMaterial color={colors.pants} />
        </mesh>
      </group>

      {/* Legs */}
      <group>
        {/* Left leg */}
        <mesh
          ref={leftLegRef}
          position={[-0.2, 0.5, 0]}
          rotation={[0, 0, 0]}
        >
          <cylinderGeometry args={[0.15, 0.15, 1.0]} />
          <meshStandardMaterial color={colors.pants} />
        </mesh>
        {/* Right leg */}
        <mesh
          ref={rightLegRef}
          position={[0.2, 0.5, 0]}
          rotation={[0, 0, 0]}
        >
          <cylinderGeometry args={[0.15, 0.15, 1.0]} />
          <meshStandardMaterial color={colors.pants} />
        </mesh>
      </group>

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

      {/* Head group for animations */}
      <group ref={headGroupRef} position={[0, 2.25, 0]}>
        {/* Head */}
        <mesh>
          <sphereGeometry args={[0.25, 24, 24]} />
          <meshStandardMaterial color={colors.skin} />
        </mesh>

        {/* Hair - slightly larger sphere on top */}
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshStandardMaterial color={colors.hair} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.08, 2.3, 0.2]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.08, 2.3, 0.2]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh position={[0.08, 2.3, 0.2]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.08, 2.3, 0.2]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#000000" />
        </mesh>

        {/* Nose */}
        <mesh position={[0, 2.2, 0.25]}>
          <boxGeometry args={[0.08, 0.08, 0.1]} />
          <meshStandardMaterial color={colors.skin} />
        </mesh>

        {/* Mouth - for talking animation */}
        <mesh
          ref={mouthRef}
          position={[0, 2.15, 0.25]}
          rotation={[0, 0, 0]}
          scale={[0.15, 0.5, 0.15]}
        >
          <boxGeometry args={[0.15, 0.1, 0.15]} />
          <meshStandardMaterial color="#ff0000" />
        </mesh>
      </group>

      {/* Arms */}
      <group>
        {/* Left arm */}
        <mesh
          ref={leftArmRef}
          position={[-0.3, 1.6, 0]}
          rotation={[0, 0, 0]}
        >
          <cylinderGeometry args={[0.1, 0.1, 0.8]} />
          <meshStandardMaterial color={colors.shirt} />
        </mesh>
        {/* Right arm */}
        <mesh
          ref={rightArmRef}
          position={[0.3, 1.6, 0]}
          rotation={[0, 0, 0]}
        >
          <cylinderGeometry args={[0.1, 0.1, 0.8]} />
          <meshStandardMaterial color={colors.shirt} />
        </mesh>
      </group>

      {/* Simple name tag - using a small flat plane for now */}
      <mesh
        position={[0, 2.6, 0.3]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[1.0, 0.3]} />
        <meshStandardMaterial
          color={colors.shirt}
          opacity={0.9}
          transparent
        />
      </mesh>

      {/* Speech bubble indicator when speaking */}
      {isSpeaking && (
        <group>
          {/* Speech bubble background */}
          <mesh position={[0, 2.8, 0.5]}>
            <sphereGeometry args={[0.25, 0.25, 0.1]} />
            <meshStandardMaterial color="#ffffcc" opacity={0.9} transparent />
          </mesh>
          {/* Speech bubble tail */}
          <mesh position={[0, 2.6, 0.5]}>
            <coneGeometry args={[0.06, 0.12, 4]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#ffffcc" opacity={0.9} transparent />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default Avatar;