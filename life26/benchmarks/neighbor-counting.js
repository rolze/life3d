import { performance } from 'perf_hooks';

// Initialize an empty grid
const createEmptyGrid = (size) => {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () =>
      Array.from({ length: size }, () => false)
    )
  );
};

// Current inefficient implementation
const countNeighborsCurrent = (grid, x, y, z) => {
  const size = grid.length;
  let count = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dy === 0 && dz === 0) continue; // Skip self

        // Finite boundaries
        const nx = x + dx;
        const ny = y + dy;
        const nz = z + dz;

        if (
          nx >= 0 && nx < size &&
          ny >= 0 && ny < size &&
          nz >= 0 && nz < size
        ) {
          if (grid[nx][ny][nz]) {
            count++;
          }
        }
      }
    }
  }
  return count;
};

// Optimized implementation
const countNeighborsOptimized = (grid, x, y, z) => {
  const size = grid.length;
  let count = 0;

  const xStart = Math.max(0, x - 1);
  const xEnd = Math.min(size - 1, x + 1);
  const yStart = Math.max(0, y - 1);
  const yEnd = Math.min(size - 1, y + 1);
  const zStart = Math.max(0, z - 1);
  const zEnd = Math.min(size - 1, z + 1);

  for (let nx = xStart; nx <= xEnd; nx++) {
    const gridX = grid[nx];
    for (let ny = yStart; ny <= yEnd; ny++) {
      const gridXY = gridX[ny];
      for (let nz = zStart; nz <= zEnd; nz++) {
        if (nx === x && ny === y && nz === z) continue; // Skip self
        if (gridXY[nz]) {
          count++;
        }
      }
    }
  }
  return count;
};

// Calculate next generation
const nextGeneration = (grid, countFn) => {
  const size = grid.length;
  const newGrid = createEmptyGrid(size);

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const neighbors = countFn(grid, x, y, z);
        const isAlive = grid[x][y][z];

        if (isAlive) {
          // Survive: 4 or 5 neighbors
          if (neighbors === 4 || neighbors === 5) {
            newGrid[x][y][z] = true;
          }
        } else {
          // Birth: exactly 5 neighbors
          if (neighbors === 5) {
            newGrid[x][y][z] = true;
          }
        }
      }
    }
  }

  return newGrid;
};

async function runBenchmark() {
  const gridSize = 30; // 30x30x30 is 27,000 cells. Enough to show clear perf difference without taking forever
  console.log(`Setting up ${gridSize}x${gridSize}x${gridSize} grid...`);

  const grid = createEmptyGrid(gridSize);

  // Set some active cells to make neighbor counting non-trivial
  const mid = Math.floor(gridSize / 2);
  grid[mid][mid][mid] = true;
  grid[mid][mid + 1][mid] = true;
  grid[mid][mid - 1][mid] = true;
  grid[mid + 1][mid][mid] = true;
  grid[mid][mid][mid + 1] = true;

  const iterations = 50;

  console.log(`Running benchmark with ${iterations} iterations...`);

  // Warmup
  nextGeneration(grid, countNeighborsCurrent);
  nextGeneration(grid, countNeighborsOptimized);

  // Measure current implementation
  const startCurrent = performance.now();
  for (let i = 0; i < iterations; i++) {
    nextGeneration(grid, countNeighborsCurrent);
  }
  const endCurrent = performance.now();
  const timeCurrent = endCurrent - startCurrent;

  // Measure optimized implementation
  const startOptimized = performance.now();
  for (let i = 0; i < iterations; i++) {
    nextGeneration(grid, countNeighborsOptimized);
  }
  const endOptimized = performance.now();
  const timeOptimized = endOptimized - startOptimized;

  console.log('\n--- Benchmark Results ---');
  console.log(`Current (Loop & Bounds Check): ${timeCurrent.toFixed(2)} ms (${(timeCurrent / iterations).toFixed(2)} ms/op)`);
  console.log(`Optimized (Cached Lookups): ${timeOptimized.toFixed(2)} ms (${(timeOptimized / iterations).toFixed(2)} ms/op)`);

  const speedup = timeCurrent / timeOptimized;
  console.log(`\nImprovement: Optimized is ${speedup.toFixed(2)}x faster than Current`);

  const timeDiff = timeCurrent - timeOptimized;
  console.log(`Time saved per ${iterations} operations: ${timeDiff.toFixed(2)} ms`);
}

runBenchmark().catch(console.error);
