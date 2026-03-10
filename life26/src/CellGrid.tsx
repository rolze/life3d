import React, { useRef, useState, useMemo } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { type Grid3D, GRID_SIZE } from './gameLogic';

interface GridProps {
  grid: Grid3D;
  cellSize?: number;
  gap?: number;
  activeLayer: number;
  onCellToggle: (x: number, y: number, z: number) => void;
}

export const CellGrid: React.FC<GridProps> = ({
  grid,
  cellSize = 0.8,
  gap = 0.2,
  activeLayer,
  onCellToggle
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [hoveredPos, setHoveredPos] = useState<[number, number, number] | null>(null);

  const cellStride = cellSize + gap;
  const totalSize = GRID_SIZE * cellStride - gap;
  const offset = totalSize / 2 - cellSize / 2;

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // X is right/left, Y is up/down, Z is forward/backward
  const planeY = activeLayer * cellStride - offset;

  // We update instances continuously
  useFrame(() => {
    if (!meshRef.current) return;

    let i = 0;
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let z = 0; z < GRID_SIZE; z++) {
          const isAlive = grid[x][y][z];

          dummy.position.set(
            x * cellStride - offset,
            y * cellStride - offset,
            z * cellStride - offset
          );

          if (isAlive) {
            dummy.scale.set(1, 1, 1);
          } else {
            dummy.scale.set(0, 0, 0);
          }

          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
          i++;
        }
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    // We only care about intersections on the active plane
    const point = e.point;

    // Map from world coordinates to grid index
    let gridX = Math.round((point.x + offset) / cellStride);
    let gridZ = Math.round((point.z + offset) / cellStride);

    // Check if the pointer is roughly within bounds
    if (gridX >= 0 && gridX < GRID_SIZE && gridZ >= 0 && gridZ < GRID_SIZE) {
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
        args={[undefined, undefined, GRID_SIZE * GRID_SIZE * GRID_SIZE]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[cellSize, cellSize, cellSize]} />
        <meshStandardMaterial color="#4CAF50" roughness={0.4} />
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
        args={[totalSize + cellStride, GRID_SIZE, 0x888888, 0x444444]}
        position={[0, planeY, 0]}
      />

      {/* Visual wireframe cube indicating the full 15x15x15 boundary */}
      <mesh>
        <boxGeometry args={[totalSize + cellStride, totalSize + cellStride, totalSize + cellStride]} />
        <meshBasicMaterial color="#333333" wireframe transparent opacity={0.2} />
      </mesh>

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
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
};
