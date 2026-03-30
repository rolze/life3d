import React, { useRef, useState, useMemo, useEffect } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { type Grid3D, type DeadCell } from './gameLogic';
import { ParticleSystem } from './ParticleSystem';

interface GridProps {
  grid: Grid3D;
  deadCells?: DeadCell[];
  cellSize?: number;
  gap?: number;
  activeLayer: number;
  onCellToggle: (x: number, y: number, z: number) => void;
}

export const CellGrid: React.FC<GridProps> = ({
  grid,
  deadCells = [],
  cellSize = 0.8,
  gap = 0.2,
  activeLayer,
  onCellToggle
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [hoveredPos, setHoveredPos] = useState<[number, number, number] | null>(null);

  const gridSize = grid.length;
  const cellStride = cellSize + gap;
  const totalSize = gridSize * cellStride - gap;
  const offset = totalSize / 2 - cellSize / 2;

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Track active particle systems
  const [explosions, setExplosions] = useState<Array<{ id: string; x: number; y: number; z: number }>>([]);

  // Handle incoming dead cells
  useEffect(() => {
    if (deadCells && deadCells.length > 0) {
      const newExplosions = deadCells.map(dc => ({
        ...dc,
        id: crypto.randomUUID(),
      }));
      // Defer state update to avoid cascading renders
      setTimeout(() => {
        setExplosions(prev => [...prev, ...newExplosions]);
      }, 0);
    }
  }, [deadCells]);

  // X is right/left, Y is up/down, Z is forward/backward
  const planeY = activeLayer * cellStride - offset;

  // Update instances only when the grid changes to prevent massive performance drops on larger sizes
  useEffect(() => {
    if (!meshRef.current) return;

    let aliveCount = 0;
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          const isAlive = grid[x][y][z];

          if (isAlive) {
            dummy.position.set(
              x * cellStride - offset,
              y * cellStride - offset,
              z * cellStride - offset
            );

            // Since we only process alive cells, scale is always 1
            dummy.scale.set(1, 1, 1);

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(aliveCount, dummy.matrix);
            aliveCount++;
          }
        }
      }
    }
    meshRef.current.count = aliveCount;
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [grid, gridSize, cellStride, offset, dummy]);

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    // We only care about intersections on the active plane
    const point = e.point;

    // Map from world coordinates to grid index
    const gridX = Math.round((point.x + offset) / cellStride);
    const gridZ = Math.round((point.z + offset) / cellStride);

    // Check if the pointer is roughly within bounds
    if (gridX >= 0 && gridX < gridSize && gridZ >= 0 && gridZ < gridSize) {
      setHoveredPos([gridX, activeLayer, gridZ]);
    } else {
      setHoveredPos(null);
    }
  };

  const handlePointerOut = () => {
    setHoveredPos(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (hoveredPos) {
      onCellToggle(hoveredPos[0], hoveredPos[1], hoveredPos[2]);
    }
  };

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, gridSize * gridSize * gridSize]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[cellSize, cellSize, cellSize]} />
        <meshStandardMaterial
          color="#4CAF50"
          emissive="#2E7D32"
          emissiveIntensity={2}
          toneMapped={false}
          roughness={0.4}
        />
      </instancedMesh>

      {/* Invisible catching plane */}
      <mesh
        position={[0, planeY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        visible={false}
      >
        <planeGeometry args={[totalSize * 2, totalSize * 2]} />
        <meshBasicMaterial transparent opacity={0.1} />
      </mesh>

      {/* Grid helper for active layer slice */}
      <gridHelper
        args={[totalSize + cellStride, gridSize, 0x444444, 0x222222]}
        position={[0, planeY, 0]}
      />

      {/* Visual wireframe cube indicating the full 15x15x15 boundary */}
      <mesh>
        <boxGeometry args={[totalSize + cellStride, totalSize + cellStride, totalSize + cellStride]} />
        <meshBasicMaterial color="#222222" wireframe transparent opacity={0.1} />
      </mesh>

      {/* Explosions for dying cells */}
      {explosions.map((exp) => (
        <ParticleSystem
          key={exp.id}
          position={[
            exp.x * cellStride - offset,
            exp.y * cellStride - offset,
            exp.z * cellStride - offset,
          ]}
          onComplete={() => {
            setExplosions((prev) => prev.filter((e) => e.id !== exp.id));
          }}
        />
      ))}

      {/* Hover preview box */}
      {hoveredPos && (
        <mesh
          position={[
            hoveredPos[0] * cellStride - offset,
            hoveredPos[1] * cellStride - offset,
            hoveredPos[2] * cellStride - offset,
          ]}
        >
          <boxGeometry args={[cellSize, cellSize, cellSize]} />
          <meshStandardMaterial
            color={grid[hoveredPos[0]][hoveredPos[1]][hoveredPos[2]] ? "#FF5252" : "#81C784"}
            emissive={grid[hoveredPos[0]][hoveredPos[1]][hoveredPos[2]] ? "#D32F2F" : "#388E3C"}
            emissiveIntensity={1}
            toneMapped={false}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
};
