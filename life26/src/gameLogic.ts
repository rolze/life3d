export type Grid3D = boolean[][][];

export interface DeadCell {
  x: number;
  y: number;
  z: number;
}

export interface GameState {
  grid: Grid3D;
  deadCells: DeadCell[];
}

// Initialize an empty grid
export const createEmptyGrid = (size: number): Grid3D => {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () =>
      Array.from({ length: size }, () => false)
    )
  );
};

export const createEmptyState = (size: number): GameState => ({
  grid: createEmptyGrid(size),
  deadCells: [],
});

// Count living neighbors (26-neighbor Moore neighborhood)
export const countNeighbors = (grid: Grid3D, x: number, y: number, z: number): number => {
  const size = grid.length;
  let count = 0;

  const xStart = Math.max(0, x - 1);
  const xEnd = Math.min(size - 1, x + 1);
  const yStart = Math.max(0, y - 1);
  const yEnd = Math.min(size - 1, y + 1);
  const zStart = Math.max(0, z - 1);
  const zEnd = Math.min(size - 1, z + 1);

  for (let nx = xStart; nx <= xEnd; nx++) {
    const gridX = grid[nx];
    for (let ny = yStart; ny <= yEnd; ny++) {
      const gridXY = gridX[ny];
      for (let nz = zStart; nz <= zEnd; nz++) {
        if (nx === x && ny === y && nz === z) continue; // Skip self
        if (gridXY[nz]) {
          count++;
        }
      }
    }
  }
  return count;
};

// Calculate next generation based on Life 4555 rules
export const nextGeneration = (grid: Grid3D): GameState => {
  const size = grid.length;
  const newGrid = createEmptyGrid(size);
  const deadCells: DeadCell[] = [];

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const neighbors = countNeighbors(grid, x, y, z);
        const isAlive = grid[x][y][z];

        if (isAlive) {
          // Survive: 4 or 5 neighbors
          if (neighbors === 4 || neighbors === 5) {
            newGrid[x][y][z] = true;
          } else {
            deadCells.push({ x, y, z });
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

  return { grid: newGrid, deadCells };
};
