import { performance } from 'perf_hooks';

// Current implementation
function createEmptyGridCurrent(size) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () =>
      Array.from({ length: size }, () => false)
    )
  );
}

// Optimized with nested loops
function createEmptyGridLoops(size) {
  const grid = new Array(size);
  for (let x = 0; x < size; x++) {
    const plane = new Array(size);
    for (let y = 0; y < size; y++) {
      plane[y] = new Array(size).fill(false);
    }
    grid[x] = plane;
  }
  return grid;
}

// Optimized with 1D Uint8Array
function createEmptyGrid1D(size) {
  return new Uint8Array(size * size * size);
}

async function runBenchmark() {
  const gridSize = 100;
  const iterations = 50;

  console.log(`Benchmarking grid initialization for ${gridSize}x${gridSize}x${gridSize}...`);

  // Warmup
  for (let i = 0; i < 5; i++) {
    createEmptyGridCurrent(gridSize);
    createEmptyGridLoops(gridSize);
    createEmptyGrid1D(gridSize);
  }

  // Measure Current
  const startCurrent = performance.now();
  for (let i = 0; i < iterations; i++) {
    createEmptyGridCurrent(gridSize);
  }
  const endCurrent = performance.now();
  const timeCurrent = endCurrent - startCurrent;

  // Measure Loops
  const startLoops = performance.now();
  for (let i = 0; i < iterations; i++) {
    createEmptyGridLoops(gridSize);
  }
  const endLoops = performance.now();
  const timeLoops = endLoops - startLoops;

  // Measure 1D
  const start1D = performance.now();
  for (let i = 0; i < iterations; i++) {
    createEmptyGrid1D(gridSize);
  }
  const end1D = performance.now();
  const time1D = end1D - start1D;

  console.log('\n--- Benchmark Results ---');
  console.log(`Current (Array.from): ${timeCurrent.toFixed(2)} ms (${(timeCurrent / iterations).toFixed(2)} ms/op)`);
  console.log(`Nested Loops: ${timeLoops.toFixed(2)} ms (${(timeLoops / iterations).toFixed(2)} ms/op)`);
  console.log(`1D Uint8Array: ${time1D.toFixed(2)} ms (${(time1D / iterations).toFixed(2)} ms/op)`);

  console.log(`\nLoops improvement: ${(timeCurrent / timeLoops).toFixed(2)}x faster`);
  console.log(`1D improvement: ${(timeCurrent / time1D).toFixed(2)}x faster`);
}

runBenchmark().catch(console.error);
