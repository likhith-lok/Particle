# Copilot instructions for Particle

## Project snapshot

This repository is a single-page HTML/CSS/JavaScript particle visualizer. It is intentionally dependency-free and runs directly in a browser without a build pipeline.

- Entry point: `index.html`
- Styling: `style.css`
- Runtime logic: `script.js`
- Primary behavior: full-viewport canvas with animated particle motion, mouse interaction, distance-based connections, idle/wake states, and a lightweight FPS HUD.

## Build, test, and lint commands

There is no package manifest, build system, test runner, or linter configured in this repository.

- Local validation: open `index.html` in a modern browser.
- If a browser is available, use a quick smoke test: load the page, confirm the canvas renders, the particle count updates, and mouse movement produces visible motion.
- There are no single-test commands to run; manual browser verification is the current standard.

## High-level architecture

The project is a minimal static web app organized around a single animation loop:

- `index.html` provides the canvas and the small HUD (`#ui` with particle count and FPS).
- `style.css` sets the black, futuristic aesthetic and the full-screen layout.
- `script.js` holds the runtime state:
  - `Config` centralizes tuning values such as particle count, connection distance, mouse repulsion, idle timeout, and color palette.
  - `Particle` encapsulates each particle's position, velocity, glow, color, and per-frame update logic.
  - `Visualizer` owns the canvas context, event listeners, resizing, FPS tracking, and the main animation loop using `requestAnimationFrame`.

The render loop is intentionally simple:

1. Update particle positions and idle/mouse-driven forces.
2. Draw each particle.
3. Draw connection lines between nearby particles.
4. Update the HUD FPS value.

This is a performance-sensitive canvas animation, so most logic is tuned around a few constants and a tight loop rather than modules or framework abstractions.

## Key conventions

- Keep the project dependency-free; do not introduce frameworks, bundlers, or package-based tooling unless the repository changes significantly.
- Preserve the direct DOM + canvas approach already used in `index.html` and `script.js`.
- Prefer tuning animation behavior in the `Config` object rather than scattering magic numbers through the code.
- Respect the existing high-DPI rendering pattern: use `window.devicePixelRatio` for crisp canvas output and resize behavior.
- Keep the visual language minimal and immersive: black background, neon accent colors, subtle glow, and HUD text that feels like a futuristic interface.
- When changing animation behavior, prefer additive motion/physics tweaks that fit the “luxury particle installation” aesthetic rather than introducing new UI patterns or data flows.
- Keep the event model lightweight: mousemove, resize, and idle detection are intentionally simple and local to `Visualizer`.

## Working style for this repo

- Prefer surgical edits over broad refactors.
- If a change affects rendering or physics, verify it visually in a browser after reloading the page.
- Keep naming and structure consistent with the current code: `Config`, `Particle`, and `Visualizer` are the core object boundaries.
- Avoid introducing asynchronous loading, state management libraries, or build tooling that would be out of place in this static demo.
