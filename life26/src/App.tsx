import { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useControls, button } from 'leva';
import { useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { CellGrid } from './CellGrid';
import { createEmptyState, nextGeneration, getIndex, createRandomGlidersState } from './gameLogic';

const RotatingStars = () => {
  const starsRef = useRef<THREE.Points>(null);
  useFrame(() => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0005;
      starsRef.current.rotation.x += 0.0002;
    }
  });

  return (
    <Stars
      ref={starsRef}
      radius={100}
      depth={50}
      count={5000}
      factor={4}
      saturation={0}
      fade
      speed={1}
    />
  );
};

const CameraManager = ({ gridSize }: { gridSize: number }) => {
  const { camera } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null); // OrbitControls type isn't fully exported in older drei versions easily

  useEffect(() => {
    // Reset camera position when grid size changes to keep it in view
    // A simple heuristic: distance ~ gridSize * 1.5
    const dist = Math.max(22, gridSize * 1.5);
    camera.position.set(dist, dist * 0.7, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [gridSize, camera]);

  return <OrbitControls ref={controlsRef} makeDefault enableZoom={true} enableDamping={true} dampingFactor={0.05} target={[0, 0, 0]} />;
};

function App() {
  const [gridSize, setGridSize] = useState(26);
  const [gameState, setGameState] = useState(createRandomGlidersState(26));
  const [activeLayer, setActiveLayer] = useState(Math.floor(26 / 2));
  const [isRunning, setIsRunning] = useState(false);

  // Need a ref for the interval to be able to clear it
  const intervalRef = useRef<number | null>(null);

  // Leva Controls
  // Using gridSize as a dependency rebuilds the controls so the `max` on activeLayerCtrl is accurate
  const [{ speed }, setLeva] = useControls(() => ({
    gridSizeCtrl: {
      value: gridSize,
      min: 10,
      max: 100,
      step: 1,
      label: 'Grid Size',
      onChange: (val) => {
        setGridSize(val);
        setGameState(createEmptyState(val));
        setActiveLayer(prev => Math.min(prev, val - 1));
      }
    },
    activeLayerCtrl: {
      value: activeLayer,
      min: 0,
      max: gridSize - 1, // dynamically bound
      step: 1,
      label: 'Active Layer',
      onChange: (val) => setActiveLayer(val),
    },
    speed: {
      value: 200,
      min: 50,
      max: 1000,
      step: 50,
      label: 'Simulation Speed (ms)'
    },
    'Play / Pause': button(() => {
      setIsRunning(prev => !prev);
    }),
    Step: button(() => {
      setGameState(prev => nextGeneration(prev));
    }),
    Clear: button(() => {
      setIsRunning(false);
      setGameState(g => createEmptyState(g.grid.length));
    }),
    'Reset Pattern': button(() => {
      setIsRunning(false);
      setGameState(g => createRandomGlidersState(g.grid.length));
    })
  }), [gridSize]); // Dependency array here ensures `max` bound is updated when gridSize changes

  // Sync state to Leva when activeLayer changes via scroll / reset
  useEffect(() => {
    setLeva({
      activeLayerCtrl: activeLayer,
    });
  }, [activeLayer, setLeva]);

  // Handle Play/Pause timer
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setGameState(prev => nextGeneration(prev));
      }, speed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, speed]);

  // Handle cell toggling from CellGrid
  const handleCellToggle = useCallback((x: number, y: number, z: number) => {
    setGameState(prev => {
      const prevGrid = prev.grid;
      const size = prevGrid.length;
      const newGrid = [...prevGrid];
      newGrid[x] = [...prevGrid[x]];
      newGrid[x][y] = [...prevGrid[x][y]];

      const wasAlive = prevGrid[x][y][z];
      const isAlive = !wasAlive;

      newGrid[x][y][z] = isAlive;

      const newActiveCells = new Set(prev.activeCells);
      const index = getIndex(x, y, z, size);

      if (isAlive) {
        newActiveCells.add(index);
      } else {
        newActiveCells.delete(index);
      }

      // If cell was manually killed, spawn an explosion
      const deadCells = (!isAlive) ? [{ x, y, z }] : [];

      return { grid: newGrid, deadCells, activeCells: newActiveCells };
    });
  }, []);

  // Handle shift+mousewheel to change active layer
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault(); // Prevent page scroll or zoom if possible
        e.stopPropagation(); // Stop event from reaching OrbitControls zoom
        setActiveLayer(prev => {
          let nextLayer = prev;
          if (e.deltaY < 0) {
            nextLayer = Math.min(prev + 1, gridSize - 1);
          } else if (e.deltaY > 0) {
            nextLayer = Math.max(prev - 1, 0);
          }
          return nextLayer;
        });
      }
    };

    window.addEventListener('wheel', handleWheel, { capture: true, passive: false });
    return () => window.removeEventListener('wheel', handleWheel, { capture: true });
  }, [gridSize]); // Must depend on gridSize so the max bounds aren't stale

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <div style={{
        position: 'absolute', top: 20, left: 20, zIndex: 10, color: '#e0e0e0',
        fontFamily: 'sans-serif', pointerEvents: 'none'
      }}>
        <h2 style={{ margin: '0 0 10px 0', textShadow: '1px 1px 2px black' }}>Life26</h2>
        <p style={{ margin: '0 0 5px 0', fontSize: '14px', textShadow: '1px 1px 2px black' }}>
          {isRunning ? '🟢 Running' : '🔴 Paused'}
        </p>
        <p style={{ margin: '0 0 5px 0', fontSize: '14px', textShadow: '1px 1px 2px black' }}>
          <strong>Controls:</strong>
        </p>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', textShadow: '1px 1px 2px black' }}>
          <li>Hold <kbd>Shift</kbd> + Scroll to move selection plane.</li>
          <li>Click on grid to place/remove cells.</li>
          <li>Left click & drag to rotate camera.</li>
          <li>Right click & drag to pan camera.</li>
          <li>Scroll to zoom camera.</li>
        </ul>
      </div>

      <Canvas camera={{ position: [22, 15, 22], fov: 45 }}>
        <color attach="background" args={['#050510']} />

        <RotatingStars />

        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} />

        <CellGrid
          grid={gameState.grid}
          deadCells={gameState.deadCells}
          activeCells={gameState.activeCells}
          activeLayer={activeLayer}
          onCellToggle={handleCellToggle}
        />

        <CameraManager gridSize={gridSize} />

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            intensity={1.5}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

export default App;
