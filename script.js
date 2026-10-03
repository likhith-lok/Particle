/**
 * Particle — an interactive field of light.
 */

const Config = {
    particleCount: 500,
    maxParticleCount: 5000,
    connectionDistance: 142,
    mouseRadius: 300,
    baseRadius: 0.9,
    driftStrength: 0.075,
    repelStrength: 0.62,
    friction: 0.965,
    colors: [
        { h: 183, s: 96, l: 66 },
        { h: 211, s: 94, l: 69 },
        { h: 266, s: 82, l: 72 },
        { h: 326, s: 82, l: 74 }
    ],
    idleTimeout: 5000,
};

class Particle {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.width;
        this.y = Math.random() * this.height;
        this.vx = (Math.random() - 0.5) * 0.45;
        this.vy = (Math.random() - 0.5) * 0.45;
        this.radius = Config.baseRadius + Math.random() * 1.1;

        const color = Config.colors[Math.floor(Math.random() * Config.colors.length)];
        this.h = color.h;
        this.s = color.s;
        this.l = color.l;
        this.glow = 0;
    }

    update(mouse, isIdle, time, step) {
        const driftTime = time * 0.00022;
        this.vx += Math.sin(driftTime + this.y * 0.004) * Config.driftStrength * step;
        this.vy += Math.cos(driftTime + this.x * 0.004) * Config.driftStrength * step;

        if (isIdle) {
            this.vx += Math.sin(time * 0.00045 + this.y * 0.008) * 0.018 * step;
            this.vy += Math.cos(time * 0.00045 + this.x * 0.008) * 0.018 * step;
        }

        if (mouse.x !== null && !isIdle) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared < Config.mouseRadius * Config.mouseRadius) {
                const distance = Math.sqrt(distanceSquared);
                const force = Math.pow((Config.mouseRadius - distance) / Config.mouseRadius, 2);

                if (distance > 0) {
                    this.vx -= (dx / distance) * force * Config.repelStrength * step;
                    this.vy -= (dy / distance) * force * Config.repelStrength * step;
                }
                this.glow = force * 14;
            } else {
                this.glow *= Math.pow(0.92, step);
            }
        } else {
            this.glow *= Math.pow(0.92, step);
        }

        const friction = Math.pow(Config.friction, step);
        this.vx *= friction;
        this.vy *= friction;
        this.x += this.vx * step;
        this.y += this.vy * step;

        const padding = 24;
        if (this.x < -padding) this.x = this.width + padding;
        if (this.x > this.width + padding) this.x = -padding;
        if (this.y < -padding) this.y = this.height + padding;
        if (this.y > this.height + padding) this.y = -padding;
    }

    draw(ctx, time) {
        const hueShift = Math.sin(time * 0.00012) * 18;
        const hue = (this.h + hueShift + 360) % 360;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${hue}, ${this.s}%, ${this.l}%)`;
        ctx.shadowBlur = this.glow > 1 ? this.glow : 0;
        ctx.shadowColor = `hsl(${hue}, ${this.s}%, ${this.l}%)`;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Visualizer {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.experience = document.querySelector('.experience');
        this.countElement = document.getElementById('particle-count');
        this.densityInput = document.getElementById('particle-density');
        this.densityValue = document.getElementById('density-value');
        this.fpsElement = document.getElementById('fps');
        this.fullscreenButton = document.getElementById('fullscreen-toggle');
        this.fullscreenIcon = document.getElementById('fullscreen-icon');
        this.interactionButton = document.getElementById('interaction-toggle');
        this.particles = [];
        this.mouse = { x: null, y: null };
        this.activeTouchId = null;
        this.mouseInteractionEnabled = true;
        this.lastInteraction = performance.now();
        this.isIdle = false;
        this.dpr = 1;
        this.lastFrameTime = 0;
        this.fpsLastTime = null;
        this.frameCount = 0;
        this.animationFrame = null;

        this.resize();
        this.createParticles();
        this.setupEvents();
        this.animationFrame = document.hidden
            ? null
            : requestAnimationFrame((time) => this.animate(time));
    }

    createParticles() {
        this.particles = Array.from(
            { length: Config.particleCount },
            () => new Particle(window.innerWidth, window.innerHeight)
        );
        this.updateParticleCountDisplay();
    }

    setParticleCount(count) {
        count = Math.max(100, Math.min(Config.maxParticleCount, Math.round(count)));
        Config.particleCount = count;
        while (this.particles.length < count) {
            this.particles.push(new Particle(window.innerWidth, window.innerHeight));
        }
        this.particles.length = count;
        this.updateParticleCountDisplay();
    }

    updateParticleCountDisplay() {
        const count = String(Config.particleCount);
        this.countElement.textContent = count.padStart(3, '0');
        this.densityValue.textContent = count;
    }

    setupEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('pointermove', (event) => {
            this.updatePointer(event);
        });
        window.addEventListener('pointerdown', (event) => {
            if (event.pointerType === 'touch') this.activeTouchId = event.pointerId;
            this.updatePointer(event);
        });
        window.addEventListener('pointerup', (event) => {
            if (event.pointerId === this.activeTouchId) {
                this.activeTouchId = null;
                this.mouse.x = null;
                this.mouse.y = null;
            }
        });
        window.addEventListener('pointercancel', (event) => {
            if (event.pointerId === this.activeTouchId) {
                this.activeTouchId = null;
                this.mouse.x = null;
                this.mouse.y = null;
            }
        });
        this.densityInput.addEventListener('input', () => {
            this.setParticleCount(Number(this.densityInput.value));
        });
        this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
        this.interactionButton.addEventListener('click', () => this.toggleMouseInteraction());
        document.addEventListener('fullscreenchange', () => this.updateFullscreenButton());
        window.addEventListener('pointerleave', () => {
            if (this.activeTouchId === null) {
                this.mouse.x = null;
                this.mouse.y = null;
            }
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            } else if (this.animationFrame === null) {
                this.lastFrameTime = 0;
                this.fpsLastTime = null;
                this.frameCount = 0;
                this.animationFrame = requestAnimationFrame((time) => this.animate(time));
            }
        });
    }

    updatePointer(event) {
        if (!this.mouseInteractionEnabled || event.target.closest('.topbar, .density-control')) return;
        if (event.pointerType === 'touch' && event.pointerId !== this.activeTouchId) return;

        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
        this.lastInteraction = performance.now();
        if (this.isIdle) this.wakeUp();
    }

    async toggleFullscreen() {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await this.experience.requestFullscreen();
            }
        } catch (error) {
            console.error('Unable to toggle fullscreen mode:', error);
        }
    }

    updateFullscreenButton() {
        const isFullscreen = Boolean(document.fullscreenElement);
        this.fullscreenButton.setAttribute('aria-label', isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
        this.fullscreenButton.title = isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen';
        this.fullscreenIcon.setAttribute(
            'd',
            isFullscreen
                ? 'M8 3v5H3M16 3v5h5M8 21v-5H3m13 5v-5h5'
                : 'M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5'
        );
    }

    toggleMouseInteraction() {
        this.mouseInteractionEnabled = !this.mouseInteractionEnabled;
        if (!this.mouseInteractionEnabled) {
            this.mouse.x = null;
            this.mouse.y = null;
        }

        const label = this.mouseInteractionEnabled
            ? 'Disable pointer interaction'
            : 'Enable pointer interaction';
        this.interactionButton.setAttribute('aria-label', label);
        this.interactionButton.setAttribute('aria-pressed', String(this.mouseInteractionEnabled));
        this.interactionButton.title = label;
    }

    resize() {
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.round(window.innerWidth * this.dpr);
        this.canvas.height = Math.round(window.innerHeight * this.dpr);
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        for (const particle of this.particles) {
            particle.width = window.innerWidth;
            particle.height = window.innerHeight;
        }
    }

    wakeUp() {
        this.isIdle = false;
        if (this.statusElement) this.statusElement.textContent = 'FIELD ACTIVE';
        for (const particle of this.particles) {
            particle.vx += (Math.random() - 0.5) * 1.2;
            particle.vy += (Math.random() - 0.5) * 1.2;
        }
    }

    updateFPS(time) {
        if (this.fpsLastTime === null) {
            this.fpsLastTime = time;
            return;
        }

        this.frameCount++;
        if (time - this.fpsLastTime >= 1000) {
            this.fpsElement.textContent = String(Math.round(
                this.frameCount * 1000 / (time - this.fpsLastTime)
            ));
            this.frameCount = 0;
            this.fpsLastTime = time;
        }
    }

    buildSpatialGrid() {
        const cellSize = Config.connectionDistance;
        const grid = new Map();

        for (let index = 0; index < this.particles.length; index++) {
            const particle = this.particles[index];
            const column = Math.floor(particle.x / cellSize);
            const row = Math.floor(particle.y / cellSize);
            const key = `${column},${row}`;
            let cell = grid.get(key);

            if (!cell) {
                cell = [];
                grid.set(key, cell);
            }
            cell.push(index);
        }

        return grid;
    }

    drawConnections(grid) {
        const ctx = this.ctx;
        const cellSize = Config.connectionDistance;
        const limitSquared = cellSize * cellSize;
        const neighbors = [-1, 0, 1];
        const paths = Array.from({ length: 16 }, () => []);

        for (let i = 0; i < this.particles.length; i++) {
            const first = this.particles[i];
            const column = Math.floor(first.x / cellSize);
            const row = Math.floor(first.y / cellSize);

            for (const rowOffset of neighbors) {
                for (const columnOffset of neighbors) {
                    const cell = grid.get(`${column + columnOffset},${row + rowOffset}`);
                    if (!cell) continue;

                    for (const j of cell) {
                        if (j <= i) continue;
                        const second = this.particles[j];
                        const dx = first.x - second.x;
                        const dy = first.y - second.y;
                        const distanceSquared = dx * dx + dy * dy;

                        if (distanceSquared < limitSquared) {
                            const opacity = 1 - Math.sqrt(distanceSquared) / cellSize;
                            const bucket = Math.min(paths.length - 1, Math.floor(opacity * paths.length));
                            paths[bucket].push(first.x, first.y, second.x, second.y);
                        }
                    }
                }
            }
        }

        for (let bucket = 0; bucket < paths.length; bucket++) {
            const path = paths[bucket];
            if (path.length === 0) continue;

            ctx.beginPath();
            for (let index = 0; index < path.length; index += 4) {
                ctx.moveTo(path[index], path[index + 1]);
                ctx.lineTo(path[index + 2], path[index + 3]);
            }
            ctx.strokeStyle = `rgba(169, 207, 255, ${(bucket + 0.5) / paths.length * 0.21})`;
            ctx.lineWidth = 0.55;
            ctx.stroke();
        }
    }

    animate(time) {
        if (time - this.lastInteraction > Config.idleTimeout && !this.isIdle) {
            this.isIdle = true;
            if (this.statusElement) this.statusElement.textContent = 'FIELD RESTING';
        }

        const step = this.lastFrameTime ? Math.min((time - this.lastFrameTime) / (1000 / 60), 2) : 1;
        this.lastFrameTime = time;

        for (const particle of this.particles) {
            particle.update(this.mouse, this.isIdle, time, step);
        }

        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        const grid = this.buildSpatialGrid();
        this.drawConnections(grid);
        for (const particle of this.particles) {
            particle.draw(this.ctx, time);
        }

        this.updateFPS(time);
        this.animationFrame = requestAnimationFrame((nextTime) => this.animate(nextTime));
    }
}

new Visualizer();
