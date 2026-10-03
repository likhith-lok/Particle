/**
 * Particle Visualizer - Luxury Edition
 * High-performance organic simulation
 */

const Config = {
    particleCount: 400,
    connectionDistance: 140,
    mouseRadius: 180,
    repelRadius: 40,
    baseRadius: 1.5,
    driftStrength: 0.08,
    attractionStrength: 0.04,
    repelStrength: 0.15,
    friction: 0.96,
    colors: [
        { h: 180, s: 100, l: 50 }, // Neon Cyan
        { h: 200, s: 100, l: 60 }, // Electric Blue
        { h: 260, s: 80, l: 60 },  // Deep Purple
        { h: 320, s: 90, l: 70 }   // Soft Pink
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
        this.vx = (Math.random() - 0.5) * 1.2;
        this.vy = (Math.random() - 0.5) * 1.2;
        this.radius = Config.baseRadius + Math.random() * 1.5;

        const colorBase = Config.colors[Math.floor(Math.random() * Config.colors.length)];
        this.h = colorBase.h;
        this.s = colorBase.s;
        this.l = colorBase.l;
        this.glow = 0;
    }

    update(mouse, isIdle, time) {
        // 1. Organic Noise Drift (Pseudo-Perlin)
        this.vx += Math.sin(time * 0.001 + this.y * 0.01) * Config.driftStrength;
        this.vy += Math.cos(time * 0.001 + this.x * 0.01) * Config.driftStrength;

        // 2. Ambient Breathing (Idle mode)
        if (isIdle) {
            this.vx += Math.sin(time * 0.002 + this.y * 0.005) * 0.03;
            this.vy += Math.cos(time * 0.002 + this.x * 0.005) * 0.03;
        }

        // 3. Mouse Interaction (Gravity Well)
        if (mouse.x !== null) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            if (dist < Config.mouseRadius) {
                const force = (Config.mouseRadius - dist) / Config.mouseRadius;

                if (dist < Config.repelRadius) {
                    // Strong repel
                    const repelForce = (Config.repelRadius - dist) / Config.repelRadius;
                    this.vx -= (dx / dist) * repelForce * Config.repelStrength;
                    this.vy -= (dy / dist) * repelForce * Config.repelStrength;
                } else {
                    // Soft attract
                    this.vx += (dx / dist) * force * Config.attractionStrength;
                    this.vy += (dy / dist) * force * Config.attractionStrength;
                }
                this.glow = force * 15;
            } else {
                this.glow *= 0.9;
            }
        } else {
            this.glow *= 0.9;
        }

        // Physics
        this.vx *= Config.friction;
        this.vy *= Config.friction;
        this.x += this.vx;
        this.y += this.vy;

        // Screen Wrap
        if (this.x < 0) this.x = this.width;
        if (this.x > this.width) this.x = 0;
        if (this.y < 0) this.y = this.height;
        if (this.y > this.height) this.y = 0;
    }

    draw(ctx, time) {
        const hueShift = Math.sin(time * 0.0005) * 20;
        const finalH = (this.h + hueShift + 360) % 360;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${finalH}, ${this.s}%, ${this.l}%)`;

        if (this.glow > 2) {
            ctx.shadowBlur = this.glow;
            ctx.shadowColor = `hsl(${finalH}, ${this.s}%, ${this.l}%)`;
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Visualizer {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null };
        this.lastMouseTime = Date.now();
        this.isIdle = false;

        this.fpsLastTime = 0;
        this.frameCount = 0;
        this.fps = 0;

        this.init();
        this.setupEvents();
        this.animate(0);
    }

    init() {
        this.resize();
        this.particles = [];
        for (let i = 0; i < Config.particleCount; i++) {
            this.particles.push(new Particle(this.canvas.width, this.canvas.height));
        }
        document.getElementById('particle-count').textContent = Config.particleCount;
    }

    setupEvents() {
        window.addEventListener('resize', () => this.resize());

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.lastMouseTime = Date.now();

            if (this.isIdle) {
                this.wakeUp();
            }
        });

        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    resize() {
        // Handle High-DPI displays properly
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.scale(dpr, dpr);

        // Update particle boundaries
        this.particles.forEach(p => {
            p.width = window.innerWidth;
            p.height = window.innerHeight;
        });
    }

    wakeUp() {
        this.isIdle = false;
        this.particles.forEach(p => {
            p.vx += (Math.random() - 0.5) * 4;
            p.vy += (Math.random() - 0.5) * 4;
        });
    }

    updateFPS(time) {
        this.frameCount++;
        if (time - this.fpsLastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsLastTime = time;
            document.getElementById('fps').textContent = this.fps;
        }
    }

    drawConnections() {
        const ctx = this.ctx;
        ctx.lineWidth = 0.6;

        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distSq = dx * dx + dy * dy;
                const limitSq = Config.connectionDistance * Config.connectionDistance;

                if (distSq < limitSq) {
                    const dist = Math.sqrt(distSq);
                    const opacity = 1 - (dist / Config.connectionDistance);
                    ctx.strokeStyle = `rgba(180, 220, 255, ${opacity * 0.2})`;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
    }

    animate(time) {
        // Idle logic
        if (Date.now() - this.lastMouseTime > Config.idleTimeout) {
            this.isIdle = true;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and Draw Particles
        this.particles.forEach(p => {
            p.update(this.mouse, this.isIdle, time);
            p.draw(this.ctx, time);
        });

        this.drawConnections();
        this.updateFPS(time);

        requestAnimationFrame((t) => this.animate(t));
    }
}

new Visualizer();
