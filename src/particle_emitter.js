import {init_particle} from "./particle.js";

export function init_particle_system(regl, resources, options) {
  class ParticleSystemActor {
    constructor(options, regl, resources) {
      const {size, type, position, velocity, initial_count, count, frequency, lifetime, custom_shader} = options;
      this.size = size;
      this.type = type;
      this.position = position;
      this.velocity = velocity === undefined ? [0,0,0] : velocity;

      this.count = count;
      this.last_spawn = 0;
      this.frequency = frequency;

      this.lifetime = lifetime;

      this.regl = regl;
      this.resources = resources;
      this.options = options;

      this.particles = [];

      for (let i = 0; i < initial_count; ++i) {
        this.particles.push(init_particle(regl, resources, options));
      }
    }

    calculate_model_matrix(frame) {
      this.options.sim_time = frame.sim_time;
      if (this.particles.length < this.count && frame.sim_time - this.last_spawn > this.frequency) {
        this.last_spawn = frame.sim_time;
        this.particles.push(init_particle(this.regl, this.resources, this.options));
      }
      for (let index = 0; index < this.particles.length; ++index) {
        if (this.particles[index].age > this.lifetime) {
          if (frame.sim_time - this.last_spawn > this.frequency) {
            this.last_spawn = frame.sim_time;
            this.particles[index].reset(this.options);
          } else {
            this.particles.splice(index, 1);
            --index;
            continue;
          }
        }
        const particle = this.particles[index];
        particle.calculate_model_matrix(frame);
      }
    }

    draw(frame) {
      for (const particle of this.particles) {
        particle.draw(frame);
      }
    }
  }

  return new ParticleSystemActor(options, regl, resources);
}
