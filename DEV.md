# Development Guide

This repository now contains a modern, browser-based 3D cellular automaton editor based on the original Turbo Pascal prototype, located in the `life26` directory.

## Prerequisites

- Node.js (v16 or higher is recommended)
- npm (installed with Node.js)

## Getting Started

To run the application locally, follow these steps:

1. **Navigate to the web app directory:**
   ```bash
   cd life26
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in Browser:**
   The terminal will output a local URL (typically `http://localhost:5173/`). Open this URL in your web browser to view and interact with the 3D Game of Life.

## Controls

Once the application is running, you can interact with the 3D grid:
- **Change Layer:** Hold `Shift` + Scroll to move the selection plane up and down the Z-axis (depth).
- **Place/Remove Cells:** Click on the visible grid slice to toggle cells at the current layer.
- **Rotate Camera:** Left click and drag.
- **Pan Camera:** Right click and drag.
- **Zoom Camera:** Scroll without holding `Shift`.

Use the control panel in the top right to start/pause the simulation, step manually, change speed, or clear the board.
