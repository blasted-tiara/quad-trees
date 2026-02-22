import { Universe, Vector2 } from "quad-trees";
import { memory } from 'quad-trees/quad_trees_bg.wasm';

const UNIVERSE_WIDTH = 80.0;
const UNIVERSE_HEIGHT = 80.0;
const UNIVERSE_PARTICLE_COUNT = 600;

const PARTICLE_RADIUS = 2.0;
const PARTICLE_COLOR = '#999999';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;

const universe = Universe.new(UNIVERSE_WIDTH, UNIVERSE_HEIGHT, UNIVERSE_PARTICLE_COUNT);
const particle_count = universe.particle_count();

const canvas = document.getElementById("quad-trees-canvas");
canvas.height = CANVAS_HEIGHT;
canvas.width = CANVAS_WIDTH;
const ctx = canvas.getContext('2d');

const renderLoop = () => {
    drawParticles();
    universe.tick();

    requestAnimationFrame(renderLoop);
}

const drawParticles = () => {
    const particlesPtr = universe.particle_ptr();
    const particles = new Float32Array(memory.buffer, particlesPtr, particle_count);

    for (let i = 0; i < particle_count; i+=2) {
        ctx.fillStyle = getRandomColor(particles[i] - 20, particles[i + 1] - 40);
        ctx.beginPath();
        drawParticle(particles[i], particles[i + 1]);
    }
}

const drawParticle = (x, y) => {
    ctx.arc(x / UNIVERSE_WIDTH * CANVAS_WIDTH, y / UNIVERSE_HEIGHT * CANVAS_HEIGHT, PARTICLE_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
}

const getRandomColor = (x, y) => {
    return 'hsla(' + ((x * x + y + x * y) / Math.sqrt( 100 * x * y * x) * 360 + 20 * (Math.random() - 0.5)) + ', '+ (30 + Math.random() * 40) + '%, 70%, 1)'; 
}

requestAnimationFrame(renderLoop);
