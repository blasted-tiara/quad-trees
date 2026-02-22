mod utils;

use std::fmt;

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

        self.x = self.x + (rng.random::<f32>() - 0.5) * strength;
        if self.x > width {
            // Handle case where particle speed is really big
            self.x -= width;
        } else if self.x < 0.0 {
            self.x += width;
        }
        self.y = self.y + (rng.random::<f32>() - 0.1) * strength * 2.0;
        if self.y > height {
            self.y -= height;
        } else if self.y < 0.0 {
            self.y += height;
        }
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
            particle.move_random(0.1, self.width, self.height);
        }
    }

    pub fn particle_count(&self) -> usize {
        self.particles.len()
    }

    pub fn particle_ptr(&self) -> *const Vector2 {
        self.particles.as_ptr()
    }
}

