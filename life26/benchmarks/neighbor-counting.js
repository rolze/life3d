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

// --- SPARSE OPTIMIZATION (O(ActiveCells)) ---

// Convert 3D coordinates to 1D index
const getIndex = (x, y, z, size) => {
  return x * size * size + y * size + z;
};

// Convert 1D index to 3D coordinates
const getCoords = (index, size) => {
  const z = index % size;
  const y = Math.floor(index / size) % size;
  const x = Math.floor(index / (size * size));
  return { x, y, z };
};

const nextGenerationSparse = (gameState) => {
  const { grid, activeCells } = gameState;
  const size = grid.length;

  const neighborCounts = new Map();

  for (const index of activeCells) {
    const { x, y, z } = getCoords(index, size);

    const xStart = Math.max(0, x - 1);
    const xEnd = Math.min(size - 1, x + 1);
    const yStart = Math.max(0, y - 1);
    const yEnd = Math.min(size - 1, y + 1);
    const zStart = Math.max(0, z - 1);
    const zEnd = Math.min(size - 1, z + 1);

    for (let nx = xStart; nx <= xEnd; nx++) {
      for (let ny = yStart; ny <= yEnd; ny++) {
        for (let nz = zStart; nz <= zEnd; nz++) {
          if (nx === x && ny === y && nz === z) continue;

          const neighborIndex = getIndex(nx, ny, nz, size);
          neighborCounts.set(neighborIndex, (neighborCounts.get(neighborIndex) || 0) + 1);
        }
      }
    }
  }

  const newGrid = createEmptyGrid(size);
  const newActiveCells = new Set();

  for (const [index, neighbors] of neighborCounts.entries()) {
    const { x, y, z } = getCoords(index, size);
    const isAlive = grid[x][y][z];

    if (isAlive) {
      if (neighbors === 4 || neighbors === 5) {
        newGrid[x][y][z] = true;
        newActiveCells.add(index);
      }
    } else {
      if (neighbors === 5) {
        newGrid[x][y][z] = true;
        newActiveCells.add(index);
      }
    }
  }

  return { grid: newGrid, activeCells: newActiveCells };
};

async function runBenchmark() {
  const gridSize = 30; // 30x30x30 is 27,000 cells. Enough to show clear perf difference without taking forever
  console.log(`Setting up ${gridSize}x${gridSize}x${gridSize} grid...`);

  const grid = createEmptyGrid(gridSize);

  // Set some active cells to make neighbor counting non-trivial
  const mid = Math.floor(gridSize / 2);
  const activeCells = new Set();

  const addCell = (x, y, z) => {
    grid[x][y][z] = true;
    activeCells.add(getIndex(x, y, z, gridSize));
  };

  addCell(mid, mid, mid);
  addCell(mid, mid + 1, mid);
  addCell(mid, mid - 1, mid);
  addCell(mid + 1, mid, mid);
  addCell(mid, mid, mid + 1);

  let gameState = { grid, activeCells };

  const iterations = 50;

  console.log(`Running benchmark with ${iterations} iterations...`);

  // Warmup
  nextGeneration(grid, countNeighborsCurrent);
  nextGeneration(grid, countNeighborsOptimized);
  nextGenerationSparse(gameState);

  // Measure current implementation
  const startCurrent = performance.now();
  let gridCurrent = grid;
  for (let i = 0; i < iterations; i++) {
    gridCurrent = nextGeneration(gridCurrent, countNeighborsCurrent);
  }
  const endCurrent = performance.now();
  const timeCurrent = endCurrent - startCurrent;

  // Measure optimized implementation
  const startOptimized = performance.now();
  let gridOpt = grid;
  for (let i = 0; i < iterations; i++) {
    gridOpt = nextGeneration(gridOpt, countNeighborsOptimized);
  }
  const endOptimized = performance.now();
  const timeOptimized = endOptimized - startOptimized;

  // Measure sparse implementation
  const startSparse = performance.now();
  let stateSparse = gameState;
  for (let i = 0; i < iterations; i++) {
    stateSparse = nextGenerationSparse(stateSparse);
  }
  const endSparse = performance.now();
  const timeSparse = endSparse - startSparse;

  console.log('\n--- Benchmark Results ---');
  console.log(`Current (Loop & Bounds Check): ${timeCurrent.toFixed(2)} ms (${(timeCurrent / iterations).toFixed(2)} ms/op)`);
  console.log(`Optimized (Cached Lookups): ${timeOptimized.toFixed(2)} ms (${(timeOptimized / iterations).toFixed(2)} ms/op)`);
  console.log(`Sparse O(ActiveCells): ${timeSparse.toFixed(2)} ms (${(timeSparse / iterations).toFixed(2)} ms/op)`);

  const speedup = timeCurrent / timeSparse;
  console.log(`\nImprovement: Sparse is ${speedup.toFixed(2)}x faster than Current`);
  const speedupOpt = timeOptimized / timeSparse;
  console.log(`Improvement: Sparse is ${speedupOpt.toFixed(2)}x faster than Optimized Cached Lookups`);

  const timeDiff = timeCurrent - timeSparse;
  console.log(`Time saved per ${iterations} operations: ${timeDiff.toFixed(2)} ms`);
}

runBenchmark().catch(console.error);
