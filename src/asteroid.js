import {vec2, vec3, vec4, mat3, mat4} from "../lib/gl-matrix_3.3.0/esm/index.js"
import {mat4_matmul_many} from "./icg_math.js"

export function init_asteroid(regl, resources, options) {
  class AsteroidActor {
    constructor({size, start_point, end_point, speed, sim_time, texture_name}, regl, resources) {
      const mesh_uvsphere = resources.mesh_uvsphere

		  this.pipeline = regl({
			  attributes: {
				  position: mesh_uvsphere.vertex_positions,
				  tex_coord: mesh_uvsphere.vertex_tex_coords,
			  },
			  // Faces, as triplets of vertex indices
			  elements: mesh_uvsphere.faces,
	      
			  // Uniforms: global data available to the shader
			  uniforms: {
				  mat_mvp: regl.prop('mat_mvp'),
				  texture_base_color: resources[`tex/${texture_name}`],
			  },	
	      
			  vert: resources['shaders/unshaded.vert.glsl'],
			  frag: resources['shaders/unshaded.frag.glsl'],
		  })
      
		  // Keep a reference to textures
		  this.resources = resources

      this.size = size;
      this.start_point = start_point;
      this.end_point = end_point;
      this.position = vec3.clone(start_point);
      this.speed = speed;
      this.age = 0;
      this.duration = vec3.distance(this.end_point, this.start_point);
      this.last_sim_time = sim_time || 0;
      
      this.mat_model_to_world = mat4.create();
      this.mat_mvp = mat4.create();
    }

  	calculate_model_matrix({sim_time}) {
      this.age += sim_time - this.last_sim_time;
      this.last_sim_time = sim_time;
       
			// Fly towards target point
      const dir = vec3.normalize([0,0,0], vec3.subtract([0,0,0], this.end_point, this.start_point));
      vec3.scaleAndAdd(this.position, this.start_point, dir, Math.min(this.speed*this.age, this.duration));

      const M_position = mat4.create();
      const M_scale = mat4.create();
      
      mat4.fromTranslation(M_position, this.position);

      mat4.fromScaling(M_scale, [this.size, this.size, this.size]);
		  
		  // Store the combined transform in actor.mat_model_to_world
      //mat4_matmul_many(actor.mat_model_to_world, ...);
      mat4.multiply(this.mat_model_to_world, M_position, M_scale);
	  }

    draw({mat_projection, mat_view}) {
      mat4_matmul_many(this.mat_mvp, mat_projection, mat_view, this.mat_model_to_world);
      
		  this.pipeline({
			  mat_mvp: this.mat_mvp,
		  });
	  }
  }

  return new AsteroidActor(options, regl, resources);
}

