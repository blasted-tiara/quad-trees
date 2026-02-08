mod utils;

use wasm_bindgen::prelude::*;
use rand::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Copy, Debug)]
struct Vector2 {
    x: f32,
    y: f32,
}

#[wasm_bindgen]
impl Vector2 {
    fn move_random(&mut self, strength: f32, width: f32, height: f32) {
        let mut rng = rand::rng();

        self.x = (self.x + rng.random::<f32>() * strength).clamp(0.0_f32, width);
        self.y = (self.y + rng.random::<f32>() * strength).clamp(0.0_f32, height);
    }
}

#[wasm_bindgen]
struct Universe {
    width: f32,
    height: f32,
    particles: Vec<Vector2>,
}

#[wasm_bindgen]
impl Universe {
    pub fn new(width: f32, height: f32, particle_count: usize) -> Self {
        let mut rng = rand::rng();
        let mut particles = Vec::new();
        for _ in 0..particle_count {
            particles.push(Vector2 {
                x: rng.random::<f32>() * width,
                y: rng.random::<f32>() * height,
            });
        };

        Self {
            width,
            height,
            particles,
        }
    }

    pub fn tick(&mut self) {
        for particle in &mut self.particles {
            particle.move_random(1.0, self.width, self.height);
        }
    }
}
