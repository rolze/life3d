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
