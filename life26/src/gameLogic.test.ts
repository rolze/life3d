import { getGliderPattern, secureRandom } from './gameLogic.ts';
import assert from 'node:assert';

console.log('Running secureRandom tests...');

// 1. Check range
for (let i = 0; i < 1000; i++) {
  const val = secureRandom();
  assert.ok(val >= 0 && val < 1, `Value ${val} should be in [0, 1)`);
}

// 2. Basic distribution check (very loose)
let sum = 0;
const iterations = 10000;
for (let i = 0; i < iterations; i++) {
  sum += secureRandom();
}
const average = sum / iterations;
assert.ok(average > 0.4 && average < 0.6, `Average ${average} should be around 0.5`);

console.log('✅ secureRandom tests passed!');

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
