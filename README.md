# Apex GP Simulator by Jonas

A browser-based 3D Formula-style racing prototype built with Three.js and Vite.

## Current prototype features
- 3D circuit, simple grandstands, trackside scenery and open-wheel car models
- Three camera modes: T-Cam, TV Pod, and Cockpit
- Practice, Qualifying, and 5-lap Race session selection
- Keyboard driving, basic speed / brake / steering response
- Speed, gear, RPM, lap counter, timing HUD and pause / restart
- Three AI cars following the circuit

## Controls
- `W` / `Arrow Up`: throttle
- `S` / `Arrow Down`: brake
- `A` / `Arrow Left`: steer left
- `D` / `Arrow Right`: steer right
- `1`: T-Cam
- `2`: TV Pod
- `3`: Cockpit
- `P` / `Esc`: pause
- `R`: restart

## Run locally
Install Node.js 20 or newer, then run:

```bash
npm install
npm run dev
```

Vite prints a local URL (usually `http://localhost:5173`).

Create a production build with:

```bash
npm run build
```

## Deploy to Render
1. Push this project to a GitHub repository.
2. In Render, choose **New + → Static Site** and connect that repository.
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Deploy.

## Important
This is the first playable prototype, not yet a full-fidelity commercial simulator. Vehicle handling is an early custom model and the AI currently follows a racing path rather than performing advanced overtaking. Next milestones: proper tyre slip/grip curves, suspension and load transfer, braking zones, AI racecraft, track limits/penalties, pit stops, wheel/pedal input, and richer car/circuit assets.
