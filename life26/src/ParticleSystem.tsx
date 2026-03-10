import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleSystemProps {
  position: [number, number, number];
  color?: string;
  count?: number;
  duration?: number;
  onComplete: () => void;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  position,
  color = '#4CAF50', // matching the alive cell color
  count = 20,
  duration = 0.5,
  onComplete,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Track time
  const timeRef = useRef(0);

  // Dummy object for calculating matrix transforms
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pre-calculate random velocities and initial positions for each particle
  const [particles] = React.useState(() => {
    return Array.from({ length: count }, () => {
      // Random direction sphere
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);

      // Random speed
      const speed = 1 + Math.random() * 2;

      const vx = Math.sin(phi) * Math.cos(theta) * speed;
      const vy = Math.sin(phi) * Math.sin(theta) * speed;
      const vz = Math.cos(phi) * speed;

      return {
        x: 0,
        y: 0,
        z: 0,
        vx,
        vy,
        vz,
      };
    });
  });

  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_state, delta) => {
    timeRef.current += delta;

    // Check for completion
    if (timeRef.current >= duration) {
      onComplete();
      return;
    }

    // Calculate progress (0 to 1)
    const progress = timeRef.current / duration;

    // Animate opacity fading out
    if (materialRef.current) {
      // Start fading after 20% of duration
      const fadeProgress = Math.max(0, (progress - 0.2) / 0.8);
      materialRef.current.opacity = 1 - fadeProgress;
    }

    // Update particle positions and scales
    if (meshRef.current) {
      particles.forEach((p, i) => {
        // Move particle
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.z += p.vz * delta;

        // Shrink particle over time
        const scale = Math.max(0, 1 - progress);

        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        <meshStandardMaterial
          ref={materialRef}
          color={color}
          emissive="#2E7D32"
          emissiveIntensity={1.5}
          toneMapped={false}
          transparent
          opacity={1}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
};
