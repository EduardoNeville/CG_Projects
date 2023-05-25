import {vec2, vec3, vec4, mat3, mat4} from "../lib/gl-matrix_3.3.0/esm/index.js"
import {mat4_matmul_many} from "./icg_math.js"

const PIPELINE_CACHE = {};

/*
Caches pipelines by name.
`key` - name of the current pipeline
`construction_func` - function to construct the given pipeline if not found in cache
*/
function cached_pipeline(key, construction_func) {
	if(! PIPELINE_CACHE.hasOwnProperty(key) ) {
		try {
			PIPELINE_CACHE[key] = construction_func();			
		} catch (e) {
			console.error('Error in construction of pipeline', key, e);
		}
	}
	return PIPELINE_CACHE[key];
}

export function init_particle(regl, resources, options) {
  class BillboardActor {
	  init_pipeline(regl, resources, name, custom_shader) {
      let uniforms = {mat_mvp: regl.prop('mat_mvp'), color: regl.prop('color')};
      if (`noise/${name}` in resources) {
        uniforms['noise_tex'] = resources[`noise/${name}`];
        if (!custom_shader) {
          name = "default";
        }
      }
		  this.pipeline = cached_pipeline(`particle_${name}`, () => regl({
			  // Vertex attributes
			  attributes: {
				  // 4 vertices with 3 coordinates each
				  position: [
					  [-1, -1, 0],
					  [1, -1, 0],
					  [1, 1, 0],
					  [-1, 1, 0],
				  ],
			  },
        
			  // Faces, as triplets of vertex indices
			  elements: [
				  [0, 1, 2], // top right
				  [0, 2, 3], // bottom left
			  ],
        
			  uniforms: uniforms,
        
			  vert: resources[`shaders/particle_${name}.vert.glsl`],
			  frag: resources[`shaders/particle_${name}.frag.glsl`],

        depth: {enable: false},
        
			  blend : {
          enable: true,
          func: {
            srcRGB: 'src alpha',
            srcAlpha: 1,
            dstRGB: 'one minus src alpha',
            dstAlpha: 1
          },
          equation: {
            rgb: 'add',
            alpha: 'add'
          },
          color: [0, 0, 0, 0]
			  }
		  }));
	  }
    
	  constructor({size, type, position, velocity, rand_scale, sim_time, lifetime, custom_shader, ...rest}, regl, resources) {
		  this.mat_model_to_world = mat4.create();
		  this.mat_mvp = mat4.create();
      
		  this.init_pipeline(regl, resources, type, custom_shader);
      
		  this.size = size;
      this.color = vec4.create();
      this.start_color = [1., 0., 0., 1.];
      this.end_color = [1., 1., 0., 0.6];
		  this.mat_scale = mat4.fromScaling(mat4.create(), [this.size, this.size, this.size]);
      this.position = position;
      if (velocity === undefined) {
        this.velocity = [0,0,0];
      } else {
        this.velocity = vec3.clone(velocity);
	    }

      if (rand_scale !== undefined) {
        vec3.add(this.velocity, this.velocity, vec3.random([0,0,0], rand_scale));
      }
      
      this.age = 0;
      this.lifetime = lifetime;
      this.last_sim_time = sim_time === undefined ? 0 : sim_time;
    }

    reset({size, type, position, velocity, rand_scale, sim_time, lifetime, custom_shader, ...rest}) {
      this.position = position;
      if (velocity === undefined) {
        this.velocity = [0,0,0];
      } else {
        this.velocity = vec3.clone(velocity);
	    }

      if (rand_scale !== undefined) {
        vec3.add(this.velocity, this.velocity, vec3.random([0,0,0], rand_scale));
      }
      
      this.age = 0;
      this.last_sim_time = sim_time === undefined ? 0 : sim_time;      
    }
    
	  calculate_model_matrix({camera_position, sim_time}) {
      this.age += sim_time - this.last_sim_time;
      this.last_sim_time = sim_time;

      const percent = this.age / this.lifetime;
      vec4.lerp(this.color, this.start_color, this.end_color, percent);

      const M_tmp = mat4.create();
      
      const new_normal = vec3.normalize([0., 0., 0.], camera_position);
      const normal_xy = vec3.normalize([0.,0.,0.], vec3.subtract([0.,0.,0.], new_normal, vec3.scale([0.,0.,0.], [0.,0.,1.], vec3.dot([0.,0.,1.], new_normal))));
      let angle = Math.acos(vec3.dot([0., 1., 0.,], normal_xy));
      if (normal_xy[0] > 0) {
        angle = Math.PI*2 - angle;
      }
      mat4.fromZRotation(M_tmp, angle);
      
      const rot_axis = vec3.cross([0., 0., 0.], [0., 0., 1.], new_normal);
      mat4.fromRotation(this.mat_model_to_world, Math.acos(vec3.dot([0., 0., 1.], new_normal)), rot_axis);
      
      
      mat4.multiply(this.mat_model_to_world, this.mat_model_to_world, M_tmp);
      mat4.multiply(this.mat_model_to_world, this.mat_scale, this.mat_model_to_world);

      const position = vec3.add([0,0,0], this.position, vec3.scale([0,0,0], this.velocity, this.age));
      const pos_mat = mat4.fromTranslation([0,0,0], position);
      
      mat4.multiply(this.mat_model_to_world, pos_mat, this.mat_model_to_world);
	  }
    
	  draw({mat_projection, mat_view}) {
      mat4_matmul_many(this.mat_mvp, mat_projection, mat_view, this.mat_model_to_world);
      
		  this.pipeline({
			  mat_mvp: this.mat_mvp,
        color: this.color,
		  });
	  }
  }

  return new BillboardActor(options, regl, resources);
}
