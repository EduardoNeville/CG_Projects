import {vec2, vec3, vec4, mat3, mat4} from "../lib/gl-matrix_3.3.0/esm/index.js"
import {init_particle} from "./particle.js";

export function init_particle_system(regl, resources, options) {
  class ParticleSystemActor {
    constructor(options, regl, resources) {
      const {size, type, position, velocity, system_velocity, initial_count, count, frequency, spawn_count, lifetime, custom_shader} = options;
      this.size = size;
      this.type = type;
      this.position = position;
      this.velocity = velocity || [0,0,0];
      this.system_velocity = system_velocity || [0,0,0];

      this.count = count;
      this.last_spawn = 0;
      this.frequency = frequency;
      this.spawn_count = spawn_count;

      this.lifetime = lifetime;

      if (!options['start_color']) {
        options.start_color = [1., 0., 0., 1.];
      }
      if (!options['end_color']) {
        options.end_color = [1., 1., 0., 0.5];
      }

      this.regl = regl;
      this.resources = resources;
      this.options = options;
      this.options.sim_time = 0;

      this.particles = [];

      for (let i = 0; i < initial_count; ++i) {
        this.particles.push(init_particle(regl, resources, options));
      }
    }

    calculate_model_matrix(frame) {
      vec3.add(this.position, this.position, vec3.scale([0,0,0], this.system_velocity, frame.sim_time - this.options.sim_time));
      this.options.sim_time = frame.sim_time;
      if (this.particles.length < this.count && frame.sim_time - this.last_spawn > this.frequency) {
        this.last_spawn += this.frequency;
        for (let i = 0; i < Math.min(this.count - this.particles.length, this.spawn_count); ++i) {
          this.particles.push(init_particle(this.regl, this.resources, this.options));
        }
      }
      for (let index = 0; index < this.particles.length; ++index) {
        if (this.particles[index].age > this.lifetime) {
          if (frame.sim_time - this.last_spawn > this.frequency) {
            this.last_spawn = frame.sim_time;
            this.particles[index].reset(options);
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
