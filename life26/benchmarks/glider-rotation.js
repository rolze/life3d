import { performance } from 'perf_hooks';

// Mock functions based on life26/src/gameLogic.ts
const rotateX = (point, deg) => {
    const {x, y, z} = point;
    const rad = deg * Math.PI / 180;
    const newY = Math.round(y * Math.cos(rad) - z * Math.sin(rad));
    const newZ = Math.round(y * Math.sin(rad) + z * Math.cos(rad));
    return {x, y: newY, z: newZ};
};

const rotateY = (point, deg) => {
    const {x, y, z} = point;
    const rad = deg * Math.PI / 180;
    const newX = Math.round(x * Math.cos(rad) + z * Math.sin(rad));
    const newZ = Math.round(-x * Math.sin(rad) + z * Math.cos(rad));
    return {x: newX, y, z: newZ};
};

const rotateZ = (point, deg) => {
    const {x, y, z} = point;
    const rad = deg * Math.PI / 180;
    const newX = Math.round(x * Math.cos(rad) - y * Math.sin(rad));
    const newY = Math.round(x * Math.sin(rad) + y * Math.cos(rad));
    return {x: newX, y: newY, z};
};

const gliderPattern = [
  {x: 1, y: 0, z: 0}, {x: 2, y: 0, z: 0},
  {x: 0, y: 1, z: 0}, {x: 3, y: 1, z: 0},
  {x: 0, y: 2, z: 0}, {x: 3, y: 2, z: 0},

  {x: 1, y: 1, z: 1}, {x: 2, y: 1, z: 1},
  {x: 1, y: 2, z: 1}, {x: 2, y: 2, z: 1}
];

function currentImplementation(angX, angY, angZ) {
    // Repeated mapping of array in rotate/translate logic
    let rotated = gliderPattern.map(p => rotateZ(rotateY(rotateX(p, angX), angY), angZ));

    const minX = Math.min(...rotated.map(p => p.x));
    const minY = Math.min(...rotated.map(p => p.y));
    const minZ = Math.min(...rotated.map(p => p.z));

    rotated = rotated.map(p => ({
      x: p.x - minX,
      y: p.y - minY,
      z: p.z - minZ
    }));

    const maxX = Math.max(...rotated.map(p => p.x));
    const maxY = Math.max(...rotated.map(p => p.y));
    const maxZ = Math.max(...rotated.map(p => p.z));

    return { rotated, maxX, maxY, maxZ };
}

function optimizedImplementation(angX, angY, angZ) {
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

    return {
      rotated,
      spanX,
      spanY,
      spanZ
    };
}

// Validation
const angles = [0, 90, 180, 270];
const angX = angles[Math.floor(Math.random() * 4)];
const angY = angles[Math.floor(Math.random() * 4)];
const angZ = angles[Math.floor(Math.random() * 4)];

const resCur = currentImplementation(angX, angY, angZ);
const resOpt = optimizedImplementation(angX, angY, angZ);

console.log('Validation with fixed angles:', { angX, angY, angZ });
console.log('Current spans:', { spanX: resCur.maxX, spanY: resCur.maxY, spanZ: resCur.maxZ });
console.log('Optimized spans:', { spanX: resOpt.spanX, spanY: resOpt.spanY, spanZ: resOpt.spanZ });

const pointsMatch = resCur.rotated.every((p, i) =>
    p.x === resOpt.rotated[i].x &&
    p.y === resOpt.rotated[i].y &&
    p.z === resOpt.rotated[i].z
);
console.log('Points match:', pointsMatch);

if (!pointsMatch || resCur.maxX !== resOpt.spanX || resCur.maxY !== resOpt.spanY || resCur.maxZ !== resOpt.spanZ) {
    console.error('VALIDATION FAILED!');
    process.exit(1);
}

// Run benchmark
const iterations = 100000;
console.log(`\nRunning benchmark with ${iterations} iterations...`);

// Warmup
for (let i = 0; i < 1000; i++) {
    currentImplementation(90, 90, 90);
    optimizedImplementation(90, 90, 90);
}

const startCurrent = performance.now();
for (let i = 0; i < iterations; i++) {
    const aX = angles[i % 4];
    const aY = angles[(i >> 2) % 4];
    const aZ = angles[(i >> 4) % 4];
    currentImplementation(aX, aY, aZ);
}
const endCurrent = performance.now();

const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
    const aX = angles[i % 4];
    const aY = angles[(i >> 2) % 4];
    const aZ = angles[(i >> 4) % 4];
    optimizedImplementation(aX, aY, aZ);
}
const endOptimized = performance.now();

const timeCurrent = endCurrent - startCurrent;
const timeOptimized = endOptimized - startOptimized;

console.log(`Current implementation: ${timeCurrent.toFixed(2)}ms`);
console.log(`Optimized implementation: ${timeOptimized.toFixed(2)}ms`);
console.log(`Improvement: ${(timeCurrent / timeOptimized).toFixed(2)}x faster`);
console.log(`Time saved: ${(timeCurrent - timeOptimized).toFixed(2)}ms`);
