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

// Glider pattern for Life 4555
export const getGliderPattern = () => [
  {x: 1, y: 0, z: 0}, {x: 2, y: 0, z: 0},
  {x: 0, y: 1, z: 0}, {x: 3, y: 1, z: 0},
  {x: 0, y: 2, z: 0}, {x: 3, y: 2, z: 0},

  {x: 1, y: 1, z: 1}, {x: 2, y: 1, z: 1},
  {x: 1, y: 2, z: 1}, {x: 2, y: 2, z: 1}
];

export const createRandomGlidersState = (size: number, count: number = 6): GameState => {
  const newGrid = createEmptyGrid(size);
  const activeCells = new Set<number>();
  const gliderPattern = getGliderPattern();

  const rotateX = (point: {x: number, y: number, z: number}, deg: number) => {
    const {x, y, z} = point;
    const rad = deg * Math.PI / 180;
    const newY = Math.round(y * Math.cos(rad) - z * Math.sin(rad));
    const newZ = Math.round(y * Math.sin(rad) + z * Math.cos(rad));
    return {x, y: newY, z: newZ};
  };

  const rotateY = (point: {x: number, y: number, z: number}, deg: number) => {
    const {x, y, z} = point;
    const rad = deg * Math.PI / 180;
    const newX = Math.round(x * Math.cos(rad) + z * Math.sin(rad));
    const newZ = Math.round(-x * Math.sin(rad) + z * Math.cos(rad));
    return {x: newX, y, z: newZ};
  };

  const rotateZ = (point: {x: number, y: number, z: number}, deg: number) => {
    const {x, y, z} = point;
    const rad = deg * Math.PI / 180;
    const newX = Math.round(x * Math.cos(rad) - y * Math.sin(rad));
    const newY = Math.round(x * Math.sin(rad) + y * Math.cos(rad));
    return {x: newX, y: newY, z};
  };

  let glidersPlaced = 0;
  let attempts = 0;
  const maxAttempts = 1000;

  while (glidersPlaced < count && attempts < maxAttempts) {
    attempts++;

    // Rotate pattern randomly
    const angles = [0, 90, 180, 270];
    const angX = angles[Math.floor(Math.random() * 4)];
    const angY = angles[Math.floor(Math.random() * 4)];
    const angZ = angles[Math.floor(Math.random() * 4)];

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    const rotatedRaw = gliderPattern.map(p => {
      const rp = rotateZ(rotateY(rotateX(p, angX), angY), angZ);
      if (rp.x < minX) minX = rp.x;
      if (rp.y < minY) minY = rp.y;
      if (rp.z < minZ) minZ = rp.z;
      if (rp.x > maxX) maxX = rp.x;
      if (rp.y > maxY) maxY = rp.y;
      if (rp.z > maxZ) maxZ = rp.z;
      return rp;
    });

    const rotated = rotatedRaw.map(p => ({
      x: p.x - minX,
      y: p.y - minY,
      z: p.z - minZ
    }));

    const spanX = maxX - minX;
    const spanY = maxY - minY;
    const spanZ = maxZ - minZ;

    // Choose random position with padding to avoid clipping
    const padding = 2;
    if (size <= padding * 2 + Math.max(spanX, spanY, spanZ)) {
       break; // Grid too small to fit glider with padding
    }

    const startX = Math.floor(Math.random() * (size - spanX - padding * 2)) + padding;
    const startY = Math.floor(Math.random() * (size - spanY - padding * 2)) + padding;
    const startZ = Math.floor(Math.random() * (size - spanZ - padding * 2)) + padding;

    // Check for overlap in a bounding box to avoid intersecting gliders
    let overlap = false;
    for (let x = startX - 1; x <= startX + spanX + 1; x++) {
      for (let y = startY - 1; y <= startY + spanY + 1; y++) {
        for (let z = startZ - 1; z <= startZ + spanZ + 1; z++) {
          if (x >= 0 && x < size && y >= 0 && y < size && z >= 0 && z < size) {
            if (newGrid[x][y][z]) {
              overlap = true;
              break;
            }
          }
        }
        if (overlap) break;
      }
      if (overlap) break;
    }

    if (!overlap) {
      // Place glider
      for (const p of rotated) {
        const px = startX + p.x;
        const py = startY + p.y;
        const pz = startZ + p.z;
        newGrid[px][py][pz] = true;
        activeCells.add(getIndex(px, py, pz, size));
      }
      glidersPlaced++;
    }
  }

  return { grid: newGrid, deadCells: [], activeCells };
};

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
