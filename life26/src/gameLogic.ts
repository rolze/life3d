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
