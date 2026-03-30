// Initialize an empty grid
const createEmptyGrid = (size) => {
  const grid = new Array(size);
  for (let x = 0; x < size; x++) {
    grid[x] = new Array(size);
    for (let y = 0; y < size; y++) {
      grid[x][y] = new Array(size).fill(false);
    }
  }
  return grid;
};

function verifyGrid(size) {
  console.log(`Verifying grid of size ${size}...`);
  const grid = createEmptyGrid(size);

  if (grid.length !== size) {
    throw new Error(`Expected x-length ${size}, got ${grid.length}`);
  }

  for (let x = 0; x < size; x++) {
    if (grid[x].length !== size) {
      throw new Error(`Expected y-length ${size} at x=${x}, got ${grid[x].length}`);
    }
    for (let y = 0; y < size; y++) {
      if (grid[x][y].length !== size) {
        throw new Error(`Expected z-length ${size} at x=${x}, y=${y}, got ${grid[x][y].length}`);
      }
      for (let z = 0; z < size; z++) {
        if (grid[x][y][z] !== false) {
          throw new Error(`Expected false at [${x}][${y}][${z}], got ${grid[x][y][z]}`);
        }
      }
    }
  }
  console.log('Grid verification successful!');
}

try {
  verifyGrid(10);
  verifyGrid(1);
  verifyGrid(0);
} catch (e) {
  console.error('Verification failed:', e.message);
  process.exit(1);
}
