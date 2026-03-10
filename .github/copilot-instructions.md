# GitHub Copilot Instructions - Life 3D (Life26)

This repository contains both the original 1995 MS-DOS prototype of "Life 3D" written in Turbo Pascal and its modern browser-based web MVP implemented in React and Three.js. This file serves as context and instruction for GitHub Copilot regarding the project's history, scope, and technical design.

## 1. The Original Prototype (1995)

**Background:** "Life 3D" was originally built over 20 years ago as a comprehensive 3D cellular automaton simulator for MS-DOS.
**Key Features of the Original:**
- Implemented in `src/LIFE3D.PAS` using Turbo Pascal.
- Visualized a 3D grid of cells.
- Supported custom rulesets for survival and birth (e.g., how many living neighbors a cell needs to survive or be born).
- Extensive documentation available in `doc/LIFE3D.pdf` and `doc/LIFE3D.DOC`.
- Handled different neighborhood sizes and extensive UI menus for rule creation, loading/saving patterns, and simulation playback.

## 2. The Modern MVP (life26)

**Scope of the MVP:**
We have built a modern, browser-based proof-of-concept (MVP) in the `life26/` directory. The goal of this MVP is to prove the core concept: a performant 3D visualization where users can intuitively experiment with and place cells in a 3D space, and then run a simulation.

**Behavior & Features:**
- **Ruleset ("Life 4555"):** The MVP implements a specific 3D rule based on a 26-neighbor Moore neighborhood (a 3x3x3 cube around the target cell).
  - *Survival:* A living cell survives if it has exactly 4 or 5 living neighbors.
  - *Birth:* A dead cell becomes alive if it has exactly 5 living neighbors.
- **Dynamic Grid Size:** The simulation grid is an $N \times N \times N$ cube, configurable between 10 and 100 via the UI.
- **Interactive Depth Slicing:** To solve the UX problem of clicking on a 2D screen to place objects in a 3D space, the MVP introduces an "Active Layer" (a 2D plane intersecting the Y-axis).
  - The user can hold `Shift` + Mousewheel to move this active plane up and down through the 3D grid.
  - An invisible 3D plane catches raycaster events for that specific Y-level, allowing the user to hover and click to toggle cells exactly on that slice.
- **Camera Controls:** Standard 3D OrbitControls are provided (Pan, Rotate, Zoom). Zooming is intelligently disabled while holding `Shift` so that scrolling through layers doesn't accidentally zoom the camera. When the grid size is changed, the camera distance and look-at target automatically reset to keep the entire grid centered and in view.
- **Simulation Controls:** A floating UI panel (built with Leva) allows users to Play/Pause, Step manually, adjust the speed of the simulation loop, clear the grid, or load a basic starting pattern.

**Tech & Design Choices:**
- **Stack:** React 18, Vite, TypeScript.
- **3D Rendering:** `three` alongside `@react-three/fiber` (R3F) and `@react-three/drei`.
- **Performance Optimization:** Instead of rendering thousands of individual React components, the grid uses a single `instancedMesh`. The `Matrix4` updates for positioning and scaling (to show/hide) cells are calculated in a `useEffect` hook that strictly depends on the grid state, avoiding costly per-frame overhead.
- **UI:** `leva` provides a clean, dat.gui-style control panel overlay.
- **State Management:** The 3D grid is stored as a 3D boolean array (`boolean[][][]`). Next-generation calculations are purely functional and operate on copies of this array to respect React's immutability principles.

## 3. Directory Layout

```
.
├── .github/
│   └── copilot-instructions.md   # This file
├── doc/                          # Documentation for the original 1995 prototype
│   ├── LIFE3D.DOC
│   └── LIFE3D.pdf
├── src/                          # Source code for the 1995 prototype
│   ├── LIFE3D.PAS                # Main Turbo Pascal source
│   └── ...
└── life26/                       # The modern Web MVP (React + Vite + Three.js)
    ├── DEV.md                    # Local development instructions
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx               # Main application entry, state, and UI layout
        ├── CellGrid.tsx          # R3F InstancedMesh logic and raycaster plane
        ├── gameLogic.ts          # Core 3D cellular automaton math and rules ("Life 4555")
        └── main.tsx              # React DOM root
```

## 4. Future Directions / When Assisting

When generating code or making changes:
- Always prefer R3F hooks (`useThree`, `useFrame`) over raw Three.js mutation where appropriate, but remember the performance constraints of rendering up to $100^3$ (1,000,000) objects.
- `instancedMesh` is mandatory for the grid. Do not attempt to refactor to individual `<mesh>` components for the cells.
- The UI layer (Leva) is separate from the Canvas. Controls should live in `App.tsx` and pass state down as props.
- Be careful with React stale closures when dealing with `window.addEventListener` inside `useEffect`, as seen in the wheel and shift-key logic.
