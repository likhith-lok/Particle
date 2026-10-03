# Particle Visualizer

A high-end, minimal particle simulation built with vanilla HTML, CSS, and JavaScript. Designed to feel like a futuristic OS boot screen or a digital art installation.

## Features

- High-DPI rendering for crystal clear visuals on all screens.
- Noise-driven organic movement and ambient breathing animations.
- Dynamic mouse interaction with gravity wells and repulsion zones.
- Real-time particle linking with distance-based opacity.
- Smooth HSL color cycling for a luxury aesthetic.
- Performance optimized loop handling 500+ particles at 60+ FPS.
- Automatic Idle/Wake modes based on user activity.

## Setup

No installation required. Open `index.html` in any modern web browser.

## Technical Details

- Background: Pure deep black (#000000)
- Color Palette: Neon Cyan, Electric Blue, Soft Purple, Pink Accents
- Rendering: HTML5 Canvas API
- Logic: Object-Oriented JavaScript

## Performance Optimizations

- Squared distance checks to avoid expensive square root operations.
- Device pixel ratio scaling for Retina/4K support.
- Efficient animation frame management using `requestAnimationFrame`.
- Minimal DOM access within the main loop.
