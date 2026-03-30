import assert from 'node:assert';
import { createEmptyGrid } from './gameLogic.ts';

function testCreateEmptyGrid() {
  console.log('Testing createEmptyGrid...');

  const size = 3;
  const grid = createEmptyGrid(size);

  assert.strictEqual(grid.length, size, `Grid length should be ${size}`);

  for (let x = 0; x < size; x++) {
    assert.strictEqual(grid[x].length, size, `Grid[${x}] length should be ${size}`);
    for (let y = 0; y < size; y++) {
      assert.strictEqual(grid[x][y].length, size, `Grid[${x}][${y}] length should be ${size}`);
      for (let z = 0; z < size; z++) {
        assert.strictEqual(grid[x][y][z], false, `Grid[${x}][${y}][${z}] should be false`);
      }
    }
  }

  // Test size 0
  const emptyGrid = createEmptyGrid(0);
  assert.strictEqual(emptyGrid.length, 0, 'Grid size 0 should have length 0');

  // Test size 1
  const smallGrid = createEmptyGrid(1);
  assert.strictEqual(smallGrid.length, 1, 'Grid size 1 should have length 1');
  assert.strictEqual(smallGrid[0][0][0], false, 'Grid size 1 element should be false');

  console.log('✅ createEmptyGrid tests passed!');
}

testCreateEmptyGrid();
