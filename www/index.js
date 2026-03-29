import { Universe, Vector2 } from "quad-trees";
import { memory } from 'quad-trees/quad_trees_bg.wasm';

const UNIVERSE_WIDTH = 80.0;
const UNIVERSE_HEIGHT = 80.0;
const UNIVERSE_PARTICLE_COUNT = 100;

const PARTICLE_RADIUS = 3.0;
const PARTICLE_COLOR = '#999999';

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 1024;

const universe = Universe.new(UNIVERSE_WIDTH, UNIVERSE_HEIGHT, UNIVERSE_PARTICLE_COUNT);
const particle_count = universe.particle_count();

const canvas = document.getElementById("quad-trees-canvas");
canvas.height = CANVAS_HEIGHT;
canvas.width = CANVAS_WIDTH;

// Web gpu init
if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.")
}

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.")
}

const device = await adapter.requestDevice();

const ctx = canvas.getContext('webgpu');
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
ctx.configure({
    device: device,
    format:canvasFormat,
});

const vertices = new Float32Array([
    -0.8, -0.8,
    0.8, -0.8,
    0.8,  0.8,

    -0.8, -0.8,
    0.8,  0.8,
    -0.8,  0.8,
]);

const vertexBuffer = device.createBuffer({
    label: "Cell vertices",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);

const particlesPtr = universe.particle_ptr();
const particlesUniformArray = new Float32Array(memory.buffer, particlesPtr, particle_count * 2);

const particlesUniformBuffer = device.createBuffer({
    label: "Particle Positions",
    size: particlesUniformArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(particlesUniformBuffer, 0, particlesUniformArray);

const universeSizeUniformArray = new Float32Array([UNIVERSE_WIDTH, UNIVERSE_HEIGHT]);
const universeSizeUniformBuffer = device.createBuffer({
    label: "Universe Size",
    size: universeSizeUniformArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(universeSizeUniformBuffer, 0, universeSizeUniformArray);

const vertexBufferLayout = {
    arrayStride: 8,
    attributes: [{
        format: "float32x2",
        offset: 0,
        shaderLocation: 0, // Position, see vertex shader
    }],
};


// @group(0) @binding(0) var<uniform> positions: vec2f;
const cellShaderModule = device.createShaderModule({
    label: "Cell shader",
    code: `
    struct VertexInput {
        @location(0) pos: vec2f,
        @builtin(instance_index) instance: u32,
    };

    struct VertexOutput {
        @builtin(position) pos: vec4f,
        @location(0) clip_space_pos: vec2f,
    };

    @group(0) @binding(0) var<uniform> positions: array<f32, ${particle_count * 2}>;
    @group(0) @binding(1) var<uniform> universe_size: vec2f;

    @vertex
    fn vertexMain(input: VertexInput) -> VertexOutput {
        var output: VertexOutput;
        output.pos = vec4f(input.pos / 70 + (vec2f(positions[input.instance], positions[input.instance + 1]) / universe_size * 2) - 1, 0, 1);
        output.clip_space_pos = vec2f(output.pos.x, output.pos.y);
        return output;
    }

    @fragment
    fn fragmentMain(@location(0) clip_space_pos: vec2f) -> @location(0) vec4f {
        return vec4f((clip_space_pos.x + 1) / 2, (clip_space_pos.y + 1) / 2, 0, 1);
    }
  `
});

const cellPipeline = device.createRenderPipeline({
    label: "Cell pipeline",
    layout: "auto",
    vertex: {
        module: cellShaderModule,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout]
    },
    fragment: {
        module: cellShaderModule,
        entryPoint: "fragmentMain",
        targets: [{
            format: canvasFormat
        }]
    }
});

const bindGroup = device.createBindGroup({
    label: "Cell renderer bind group",
    layout: cellPipeline.getBindGroupLayout(0),
    entries: [
        {
            binding: 0,
            resource: { buffer: particlesUniformBuffer }
        }, 
        {
            binding: 1,
            resource: { buffer: universeSizeUniformBuffer }
        }
    ],
});

const encoder = device.createCommandEncoder();

const renderLoop = () => {
    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: ctx.getCurrentTexture().createView(),
            loadOp: "clear",
            clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
            storeOp: "store",
        }]
    });

    pass.setPipeline(cellPipeline);
    pass.setVertexBuffer(0, vertexBuffer);

    pass.setBindGroup(0, bindGroup);

    pass.draw(vertices.length / 2, UNIVERSE_PARTICLE_COUNT); // 6 vertices

    //draw();
    //universe.tick();

    pass.end();
    device.queue.submit([encoder.finish()]);

    // requestAnimationFrame(renderLoop);
}

const draw = () => {
    drawParticles();
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
