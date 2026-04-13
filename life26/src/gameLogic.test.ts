import { getGliderPattern } from './gameLogic.ts';
import assert from 'node:assert';

console.log('Running getGliderPattern tests...');

const pattern = getGliderPattern();

// 1. Check length
assert.strictEqual(pattern.length, 10, 'Glider pattern should have 10 points');

// 2. Check structure of each point
pattern.forEach((point, index) => {
  assert.ok('x' in point, `Point ${index} should have x`);
  assert.ok('y' in point, `Point ${index} should have y`);
  assert.ok('z' in point, `Point ${index} should have z`);
});

// 3. Verify specific coordinates
const expectedFirst = { x: 1, y: 0, z: 0 };
const expectedLast = { x: 2, y: 2, z: 1 };

assert.deepStrictEqual(pattern[0], expectedFirst, 'First point mismatch');
assert.deepStrictEqual(pattern[pattern.length - 1], expectedLast, 'Last point mismatch');

console.log('✅ getGliderPattern tests passed!');

// --- nextGeneration tests ---
import { createEmptyState, nextGeneration, getIndex } from './gameLogic.ts';

console.log('Running nextGeneration tests...');

const size = 10;
let state = createEmptyState(size);

// Test 1: Single cell dies
const x = 5, y = 5, z = 5;
state.grid[x][y][z] = true;
state.activeCells.set(getIndex(x, y, z, size), { x, y, z });

let nextState = nextGeneration(state);
assert.strictEqual(nextState.activeCells.size, 0, 'Single cell should die');
assert.strictEqual(nextState.grid[x][y][z], false, 'Single cell grid should be false');
assert.strictEqual(nextState.deadCells.length, 1, 'Should have one dead cell');
assert.deepStrictEqual(nextState.deadCells[0], { x, y, z }, 'Dead cell coordinates mismatch');

// Test 2: Birth rule (5 neighbors)
state = createEmptyState(size);
// Set 5 neighbors for (5,5,5)
// (4,5,5), (6,5,5), (5,4,5), (5,6,5), (5,5,4)
const neighbors = [
  {x: 4, y: 5, z: 5},
  {x: 6, y: 5, z: 5},
  {x: 5, y: 4, z: 5},
  {x: 5, y: 6, z: 5},
  {x: 5, y: 5, z: 4}
];
neighbors.forEach(p => {
  state.grid[p.x][p.y][p.z] = true;
  state.activeCells.set(getIndex(p.x, p.y, p.z, size), { x: p.x, y: p.y, z: p.z });
});

nextState = nextGeneration(state);
assert.ok(nextState.grid[5][5][5], 'Cell should be born with 5 neighbors');
assert.ok(nextState.activeCells.has(getIndex(5, 5, 5, size)), 'New active cell should be recorded');

console.log('✅ nextGeneration tests passed!');
