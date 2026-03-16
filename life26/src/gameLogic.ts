export type Grid3D = boolean[][][];

// Initialize an empty grid
export const createEmptyGrid = (size: number): Grid3D => {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () =>
      Array.from({ length: size }, () => false)
    )
  );
};

// Count living neighbors (26-neighbor Moore neighborhood)
export const countNeighbors = (grid: Grid3D, x: number, y: number, z: number): number => {
  const size = grid.length;
  let count = 0;

  const xStart = x > 0 ? x - 1 : 0;
  const xEnd = x < size - 1 ? x + 1 : size - 1;
  const yStart = y > 0 ? y - 1 : 0;
  const yEnd = y < size - 1 ? y + 1 : size - 1;
  const zStart = z > 0 ? z - 1 : 0;
  const zEnd = z < size - 1 ? z + 1 : size - 1;

  for (let nx = xStart; nx <= xEnd; nx++) {
    const gridX = grid[nx];
    for (let ny = yStart; ny <= yEnd; ny++) {
      const gridXY = gridX[ny];
      for (let nz = zStart; nz <= zEnd; nz++) {
        if (gridXY[nz]) {
          count++;
        }
      }
    }
  }

  // Subtract self if it was alive (we counted the 3x3x3 cube)
  if (
    x >= 0 && x < size &&
    y >= 0 && y < size &&
    z >= 0 && z < size &&
    grid[x][y][z]
  ) {
    count--;
  }

  return count;
};

// Calculate next generation based on Life 4555 rules
export const nextGeneration = (grid: Grid3D): Grid3D => {
  const size = grid.length;
  const newGrid = createEmptyGrid(size);

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const neighbors = countNeighbors(grid, x, y, z);
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
