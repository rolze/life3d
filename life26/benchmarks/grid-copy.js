import { performance } from 'perf_hooks';

// Simulate the grid creation
function createEmptyGrid(size) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () =>
      Array.from({ length: size }, () => false)
    )
  );
}

// Current inefficient implementation
function toggleCellCurrent(grid, x, y, z) {
  const newGrid = grid.map(layerX =>
    layerX.map(layerY => [...layerY])
  );
  newGrid[x][y][z] = !newGrid[x][y][z];
  return newGrid;
}

// Simulated optimized implementation (for testing the benchmark script)
function toggleCellOptimized(grid, x, y, z) {
  const newGrid = [...grid];
  newGrid[x] = [...grid[x]];
  newGrid[x][y] = [...grid[x][y]];
  newGrid[x][y][z] = !newGrid[x][y][z];
  return newGrid;
}

async function runBenchmark() {
  const gridSize = 100;
  console.log(`Setting up ${gridSize}x${gridSize}x${gridSize} grid...`);

  const grid = createEmptyGrid(gridSize);
  const iterations = 100;

  // Coordinates to toggle
  const x = Math.floor(gridSize / 2);
  const y = Math.floor(gridSize / 2);
  const z = Math.floor(gridSize / 2);

  // Warmup
  for (let i = 0; i < 5; i++) {
    toggleCellCurrent(grid, x, y, z);
    toggleCellOptimized(grid, x, y, z);
  }

  console.log(`Running benchmark with ${iterations} iterations...`);

  // Measure current implementation
  const startCurrent = performance.now();
  for (let i = 0; i < iterations; i++) {
    toggleCellCurrent(grid, x, y, z);
  }
  const endCurrent = performance.now();
  const timeCurrent = endCurrent - startCurrent;

  // Measure optimized implementation
  const startOptimized = performance.now();
  for (let i = 0; i < iterations; i++) {
    toggleCellOptimized(grid, x, y, z);
  }
  const endOptimized = performance.now();
  const timeOptimized = endOptimized - startOptimized;

  console.log('\n--- Benchmark Results ---');
  console.log(`Current (Deep Copy): ${timeCurrent.toFixed(2)} ms (${(timeCurrent / iterations).toFixed(2)} ms/op)`);
  console.log(`Optimized (Shallow Copy): ${timeOptimized.toFixed(2)} ms (${(timeOptimized / iterations).toFixed(2)} ms/op)`);

  const speedup = timeCurrent / timeOptimized;
  console.log(`\nImprovement: Optimized is ${speedup.toFixed(2)}x faster than Current`);

  const timeDiff = timeCurrent - timeOptimized;
  console.log(`Time saved per ${iterations} operations: ${timeDiff.toFixed(2)} ms`);
}

runBenchmark().catch(console.error);
