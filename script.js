/**
 * Particle Visualizer - Ultra Luxury Edition
 * Refined for extreme fluidity and visual depth.
 */

const Config = {
    particleCount: 500,           // Increased for richer density
    connectionDistance: 150,      // Slightly extended reach for more elegant webbing
    mouseRadius: 220,             // Wider influence for a "gravity well" feel
    repelRadius: 50,              // Stronger repulsion for tactile response
    baseRadius: 1.2,
    driftStrength: 0.12,          // More pronounced organic drift
    attractionStrength: 0.05,
    repelStrength: 0.2,
    friction: 0.95,               // Higher friction for smoother, "silky" easing
    colors: [
        { h: 180, s: 100, l: 50 }, // Neon Cyan
        { h: 210, s: 100, l: 60 }, // Electric Blue
        { h: 280, s: 80, l: 60 },  // Soft Purple
        { h: 340, s: 90, l: 70 }   // Pink Accent
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
        this.vx = (Math.random() - 0.5) * 1.0;
        this.vy = (Math.random() - 0.5) * 1.0;
        this.radius = Config.baseRadius + Math.random() * 1.5;

        const colorBase = Config.colors[Math.floor(Math.random() * Config.colors.length)];
        this.h = colorBase.h;
        this.s = colorBase.s;
        this.l = colorBase.l;
        this.glow = 0;
    }

    update(mouse, isIdle, time) {
        // 1. Organic Noise Drift
        // Using layered sine waves to mimic Perlin noise fluidity
        this.vx += Math.sin(time * 0.0008 + this.y * 0.005) * Config.driftStrength;
        this.vy += Math.cos(time * 0.0008 + this.x * 0.005) * Config.driftStrength;

        // 2. Ambient Breathing (Idle mode)
        if (isIdle) {
            this.vx += Math.sin(time * 0.0015 + this.y * 0.01) * 0.05;
            this.vy += Math.cos(time * 0.0015 + this.x * 0.01) * 0.05;
        }

        // 3. Mouse Interaction
        if (mouse.x !== null) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            if (dist < Config.mouseRadius) {
                const force = (Config.mouseRadius - dist) / Config.mouseRadius;

                if (dist < Config.repelRadius) {
                    // Repel with inverse-square feel
                    const repelForce = (Config.repelRadius - dist) / Config.repelRadius;
                    this.vx -= (dx / dist) * repelForce * Config.repelStrength;
                    this.vy -= (dy / dist) * repelForce * Config.repelStrength;
                } else {
                    // Gentle Silk Attraction
                    this.vx += (dx / dist) * force * Config.attractionStrength;
                    this.vy += (dy / dist) * force * Config.attractionStrength;
                }
                this.glow = force * 20;
            } else {
                this.glow *= 0.92;
            }
        } else {
            this.glow *= 0.92;
        }

        // Physics & Easing
        this.vx *= Config.friction;
        this.vy *= Config.friction;
        this.x += this.vx;
        this.y += this.vy;

        // Smooth Screen Wrap (Soft transition)
        const padding = 20;
        if (this.x < -padding) this.x = this.width + padding;
        if (this.x > this.width + padding) this.x = -padding;
        if (this.y < -padding) this.y = this.height + padding;
        if (this.y > this.height + padding) this.y = -padding;
    }

    draw(ctx, time) {
        // Slow Color Cycling
        const hueShift = Math.sin(time * 0.0003) * 30;
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
            this.particles.push(new Particle(this.canvas.width / (window.devicePixelRatio || 1), this.canvas.height / (window.devicePixelRatio || 1)));
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
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.scale(dpr, dpr);

        // Update particle boundaries for wrap-around logic
        this.particles.forEach(p => {
            p.width = window.innerWidth;
            p.height = window.innerHeight;
        });
    }

    wakeUp() {
        this.isIdle = false;
        this.particles.forEach(p => {
            // Gentle wake-up burst
            p.vx += (Math.random() - 0.5) * 5;
            p.vy += (Math.random() - 0.5) * 5;
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
        ctx.lineWidth = 0.5;

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

                    // Line colors blend based on distance for a premium look
                    ctx.strokeStyle = `rgba(180, 230, 255, ${opacity * 0.15})`;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
    }

    animate(time) {
        if (Date.now() - this.lastMouseTime > Config.idleTimeout) {
            this.isIdle = true;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
