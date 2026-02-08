import { Universe } from "quad-trees";

const UNIVERSE_WIDTH = 50.0;
const UNIVERSE_HEIGHT = 50.0;
const UNIVERSE_PARTICLE_COUNT = 100;

const pre = document.getElementById("quad-trees-canvas");
const universe = Universe.new(UNIVERSE_WIDTH, UNIVERSE_HEIGHT, UNIVERSE_PARTICLE_COUNT);

