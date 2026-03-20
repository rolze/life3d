import * as THREE from 'three';
import { performance } from 'perf_hooks';

const gridSize = 30; // 30^3 = 27000 instances
const cellStride = 1;
const offset = 10;

// Generate a random grid (2% alive)
const grid = Array.from({ length: gridSize }, () =>
  Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => Math.random() > 0.98)
  )
);

const dummy = new THREE.Object3D();
const meshRef = {
  current: {
    setMatrixAt: (i, matrix) => {},
    instanceMatrix: { needsUpdate: false },
    count: 0
  }
};

function runBaseline() {
  const start = performance.now();

  let i = 0;
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
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

  const end = performance.now();
  return end - start;
}

function runOptimized() {
  const start = performance.now();

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

  const end = performance.now();
  return end - start;
}

const iters = 1000;

let totalBase = 0;
for(let k=0; k<iters; k++) {
  totalBase += runBaseline();
}

let totalOpt = 0;
for(let k=0; k<iters; k++) {
  totalOpt += runOptimized();
}

console.log(`Grid size: ${gridSize}x${gridSize}x${gridSize} (${gridSize*gridSize*gridSize} cells), 2% alive`);
console.log(`Baseline average time: ${(totalBase / iters).toFixed(3)} ms per update`);
console.log(`Optimized average time: ${(totalOpt / iters).toFixed(3)} ms per update`);
