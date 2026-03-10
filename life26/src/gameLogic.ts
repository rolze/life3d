export const GRID_SIZE = 15;

export type Grid3D = boolean[][][];

// Initialize an empty grid
export const createEmptyGrid = (): Grid3D => {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => false)
    )
  );
};

// Count living neighbors (26-neighbor Moore neighborhood)
export const countNeighbors = (grid: Grid3D, x: number, y: number, z: number): number => {
  let count = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dy === 0 && dz === 0) continue; // Skip self

        // Wrap around (toroidal grid) or finite boundaries?
        // Let's stick to finite boundaries for MVP since it's 15x15x15
        const nx = x + dx;
        const ny = y + dy;
        const nz = z + dz;

        if (
          nx >= 0 && nx < GRID_SIZE &&
          ny >= 0 && ny < GRID_SIZE &&
          nz >= 0 && nz < GRID_SIZE
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
  const newGrid = createEmptyGrid();

  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let z = 0; z < GRID_SIZE; z++) {
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
