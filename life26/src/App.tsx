import { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControls, button } from 'leva';
import { useThree } from '@react-three/fiber';
import { CellGrid } from './CellGrid';
import { createEmptyGrid, nextGeneration } from './gameLogic';

const CameraManager = ({ gridSize, isShiftDown }: { gridSize: number, isShiftDown: boolean }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

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

  return <OrbitControls ref={controlsRef} makeDefault enableZoom={!isShiftDown} enableDamping={true} dampingFactor={0.05} target={[0, 0, 0]} />;
};

function App() {
  const [gridSize, setGridSize] = useState(15);
  const [grid, setGrid] = useState(createEmptyGrid(15));
  const [activeLayer, setActiveLayer] = useState(Math.floor(15 / 2));
  const [isRunning, setIsRunning] = useState(false);
  const [isShiftDown, setIsShiftDown] = useState(false);

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
        setGrid(createEmptyGrid(val));
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
      setGrid(prevGrid => nextGeneration(prevGrid));
    }),
    Clear: button(() => {
      setIsRunning(false);
      setGrid(g => createEmptyGrid(g.length));
    }),
    'Reset Pattern': button(() => {
      setIsRunning(false);
      setGrid(g => {
        const size = g.length;
        const newGrid = createEmptyGrid(size);
        const mid = Math.floor(size / 2);
        newGrid[mid][mid][mid] = true;
        newGrid[mid][mid + 1][mid] = true;
        newGrid[mid][mid - 1][mid] = true;
        newGrid[mid + 1][mid][mid] = true;
        newGrid[mid][mid][mid + 1] = true;
        return newGrid;
      });
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

  // Track shift key for disabling zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftDown(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftDown(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle shift+mousewheel to change active layer
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault(); // Prevent page scroll or zoom if possible
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

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
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
        <color attach="background" args={['#1a1a1a']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} />

        <CellGrid
          grid={grid}
          activeLayer={activeLayer}
          onCellToggle={handleCellToggle}
        />

        <CameraManager gridSize={gridSize} isShiftDown={isShiftDown} />
      </Canvas>
    </div>
  );
}

export default App;
