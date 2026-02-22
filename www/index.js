import { Universe } from "quad-trees";

const UNIVERSE_WIDTH = 80.0;
const UNIVERSE_HEIGHT = 80.0;
const UNIVERSE_PARTICLE_COUNT = 100;

const pre = document.getElementById("quad-trees-canvas");
const universe = Universe.new(UNIVERSE_WIDTH, UNIVERSE_HEIGHT, UNIVERSE_PARTICLE_COUNT);

const renderLoop = () => {
  pre.textContent = universe.render();
  universe.tick();

  requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);
