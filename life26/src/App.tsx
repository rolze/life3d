import { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControls, button } from 'leva';
import { CellGrid } from './CellGrid';
import { createEmptyGrid, nextGeneration, GRID_SIZE } from './gameLogic';

function App() {
  const [grid, setGrid] = useState(createEmptyGrid());
  const [activeLayer, setActiveLayer] = useState(Math.floor(GRID_SIZE / 2));
  const [isRunning, setIsRunning] = useState(false);

  // Need a ref for the interval to be able to clear it
  const intervalRef = useRef<number | null>(null);

  // Leva Controls
  const [{ speed }, setLeva] = useControls(() => ({
    activeLayerCtrl: {
      value: activeLayer,
      min: 0,
      max: GRID_SIZE - 1,
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
      setGrid(prevGrid => nextGeneration(prevGrid));
    }),
    Clear: button(() => {
      setIsRunning(false);
      setGrid(createEmptyGrid());
    }),
    'Reset Pattern': button(() => {
      setIsRunning(false);
      const newGrid = createEmptyGrid();
      const mid = Math.floor(GRID_SIZE / 2);
      // Small 3D oscillator/glider-like shape
      newGrid[mid][mid][mid] = true;
      newGrid[mid][mid + 1][mid] = true;
      newGrid[mid][mid - 1][mid] = true;
      newGrid[mid + 1][mid][mid] = true;
      newGrid[mid][mid][mid + 1] = true;
      setGrid(newGrid);
    })
  }));

  // Sync state to Leva when activeLayer changes via scroll
  useEffect(() => {
    setLeva({ activeLayerCtrl: activeLayer });
  }, [activeLayer, setLeva]);

  // Handle Play/Pause timer
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setGrid(prevGrid => nextGeneration(prevGrid));
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
    setGrid(prev => {
      const newGrid = prev.map(layerX =>
        layerX.map(layerY => [...layerY])
      );
      newGrid[x][y][z] = !newGrid[x][y][z];
      return newGrid;
    });
  }, []);

  // Handle shift+mousewheel to change active layer
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault(); // Prevent page scroll or zoom if possible
        setActiveLayer(prev => {
          let nextLayer = prev;
          if (e.deltaY < 0) {
            nextLayer = Math.min(prev + 1, GRID_SIZE - 1);
          } else if (e.deltaY > 0) {
            nextLayer = Math.max(prev - 1, 0);
          }
          return nextLayer;
        });
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <div style={{
        position: 'absolute', top: 20, left: 20, zIndex: 10, color: '#e0e0e0',
        fontFamily: 'sans-serif', pointerEvents: 'none'
      }}>
        <h2 style={{ margin: '0 0 10px 0', textShadow: '1px 1px 2px black' }}>Life 3D</h2>
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
        <color attach="background" args={['#1a1a1a']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} />

        <CellGrid
          grid={grid}
          activeLayer={activeLayer}
          onCellToggle={handleCellToggle}
        />

        {/* Disable zooming when shift is held down */}
        <OrbitControls makeDefault enableDamping={true} dampingFactor={0.05} />
      </Canvas>
    </div>
  );
}

export default App;
