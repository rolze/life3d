
import { performance } from 'perf_hooks';
import { createRandomGlidersState, nextGeneration } from '../src/gameLogic.ts';

async function runBenchmark() {
  const size = 50;
  const iterations = 100;
  console.log(`Setting up ${size}x${size}x${size} grid with random gliders...`);

  let state = createRandomGlidersState(size, 100);

  console.log(`Initial active cells: ${state.activeCells.size}`);
  console.log(`Running ${iterations} iterations of nextGeneration...`);

  // Warmup
  for (let i = 0; i < 10; i++) {
    state = nextGeneration(state);
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    state = nextGeneration(state);
  }
  const end = performance.now();

  const totalTime = end - start;
  console.log(`\n--- Results ---`);
  console.log(`Total time for ${iterations} iterations: ${totalTime.toFixed(2)} ms`);
  console.log(`Average time per iteration: ${(totalTime / iterations).toFixed(2)} ms`);
  console.log(`Final active cells: ${state.activeCells.size}`);
}

runBenchmark().catch(console.error);
