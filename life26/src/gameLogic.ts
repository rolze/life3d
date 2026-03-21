export type Grid3D = boolean[][][];

export interface DeadCell {
  x: number;
  y: number;
  z: number;
}

export interface GameState {
  grid: Grid3D;
  deadCells: DeadCell[];
  activeCells: Set<number>;
}

// Convert 3D coordinates to 1D index
export const getIndex = (x: number, y: number, z: number, size: number): number => {
  return x * size * size + y * size + z;
};

// Convert 1D index to 3D coordinates
export const getCoords = (index: number, size: number): { x: number; y: number; z: number } => {
  const z = index % size;
  const y = Math.floor(index / size) % size;
  const x = Math.floor(index / (size * size));
  return { x, y, z };
};

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
  activeCells: new Set<number>(),
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

// Calculate next generation based on Life 4555 rules using sparse active cells representation
export const nextGeneration = (gameState: GameState): GameState => {
  const { grid, activeCells } = gameState;
  const size = grid.length;

  const neighborCounts = new Map<number, number>();

  // Count neighbors only around active cells
  for (const index of activeCells) {
    const { x, y, z } = getCoords(index, size);

    const xStart = Math.max(0, x - 1);
    const xEnd = Math.min(size - 1, x + 1);
    const yStart = Math.max(0, y - 1);
    const yEnd = Math.min(size - 1, y + 1);
    const zStart = Math.max(0, z - 1);
    const zEnd = Math.min(size - 1, z + 1);

    for (let nx = xStart; nx <= xEnd; nx++) {
      for (let ny = yStart; ny <= yEnd; ny++) {
        for (let nz = zStart; nz <= zEnd; nz++) {
          if (nx === x && ny === y && nz === z) continue; // Skip self

          const neighborIndex = getIndex(nx, ny, nz, size);
          neighborCounts.set(neighborIndex, (neighborCounts.get(neighborIndex) || 0) + 1);
        }
      }
    }
  }

  const newGrid = createEmptyGrid(size);
  const newActiveCells = new Set<number>();
  const deadCells: DeadCell[] = [];

  // Evaluate cells that have at least one neighbor
  for (const [index, neighbors] of neighborCounts.entries()) {
    const { x, y, z } = getCoords(index, size);
    const isAlive = grid[x][y][z];

    if (isAlive) {
      // Survive: 4 or 5 neighbors
      if (neighbors === 4 || neighbors === 5) {
        newGrid[x][y][z] = true;
        newActiveCells.add(index);
      }
    } else {
      // Birth: exactly 5 neighbors
      if (neighbors === 5) {
        newGrid[x][y][z] = true;
        newActiveCells.add(index);
      }
    }
  }

  // Handle active cells that might not be in neighborCounts (i.e., 0 neighbors)
  // Or handle deadCells calculation. Since dead cells only matter for UI explosions,
  // we just need to find active cells that didn't survive
  for (const index of activeCells) {
    if (!newActiveCells.has(index)) {
      const { x, y, z } = getCoords(index, size);
      deadCells.push({ x, y, z });
    }
  }

  return { grid: newGrid, deadCells, activeCells: newActiveCells };
};
