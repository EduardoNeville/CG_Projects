import {vec2, vec3, vec4, mat3, mat4} from "../lib/gl-matrix_3.3.0/esm/index.js"
import {mat4_matmul_many} from "./icg_math.js"

/*
	Construct the scene!
*/
export function create_scene_content() {
    const moon_actor = [
		{
			name: 'moon',
			size: 0.25,
			rotation_speed: 0.3,

			movement_type: 'planet',
			orbit: 'earth',
			orbit_radius: 2.5,
			orbit_speed: 0.4,
			orbit_phase: 0.5,

			shader_type: 'unshaded',
			texture_name: 'moonColor.jpeg',

		}
	]

	// In each planet, allocate its transformation matrix
	moon_actor.mat_model_to_world = mat4.create()

	// Lookup of actors by name
	const actors_by_name = {}
	actors_by_name[moon_actor.name] = moon_actor

	// Construct scene info
	return {
		sim_time: 0.,
		actors: moon_actor,
		actors_by_name: actors_by_name,
	}
}


export class SysOrbitalMovement {

	constructor() {
	}

	calculate_model_matrix(actor, sim_time, actors_by_name) {
		/*
		#TODO GL1.2.3
		Construct the model matrix for the current planet (actor) and store it in actor.mat_model_to_world.
		
		Orbit (if the parent actor.orbit is not null)
			* find the parent planet 
				parent = actors_by_name[actor.orbit]
			* Parent's transform is stored in
				parent.mat_model_to_world
			* Radius of orbit: 
				radius = actor.orbit_radius
			* Angle of orbit:
				angle = sim_time * actor.orbit_speed + actor.orbit_phase

		Spin around the planet's Z axis
			angle = sim_time * actor.rotation_speed (radians)
		
		Scale the unit sphere to match the desired size
			scale = actor.size
			mat4.fromScaling takes a 3D vector!
		*/

		const M_orbit = mat4.create()
    const M_tmp = mat4.create()

		if(actor.orbit !== null) {
			// Parent's translation
			const parent = actors_by_name[actor.orbit]
			const parent_translation_v = mat4.getTranslation([0, 0, 0], parent.mat_model_to_world)

			// Orbit around the parent
      mat4.fromTranslation(M_tmp, [actor.orbit_radius, 0, 0])
      mat4.fromZRotation(M_orbit, sim_time * actor.orbit_speed + actor.orbit_phase)
      mat4.multiply(M_orbit, M_orbit, M_tmp)
      mat4.fromTranslation(M_tmp, parent_translation_v)
      mat4.multiply(M_orbit, M_tmp, M_orbit)
		}

    mat4.fromZRotation(M_tmp, sim_time * actor.rotation_speed)
    mat4.multiply(M_orbit, M_orbit, M_tmp)

    mat4.fromScaling(M_tmp, [actor.size, actor.size, actor.size])
		  
		// Store the combined transform in actor.mat_model_to_world
    //mat4_matmul_many(actor.mat_model_to_world, ...);
    mat4.multiply(actor.mat_model_to_world, M_orbit, M_tmp)
	}

	simulate(scene_info) {

		const {sim_time, actors, actors_by_name} = scene_info

		// Iterate over actors which have planet movement type
		for(const actor of actors) {
			if ( actor.movement_type === 'planet' ) {
				this.calculate_model_matrix(actor, sim_time, actors_by_name)
			}
		}
	}

}

/*
	Draw the actors with 'unshaded' shader_type
*/
export class SysRenderPlanetsUnshaded {

	constructor(regl, resources) {

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
				texture_base_color: regl.prop('tex_base_color'),
			},	
	
			vert: resources['asteroid.vert.glsl'],
			frag: resources['asteroid.frag.glsl'],
		})

		// Keep a reference to textures
		this.resources = resources
	}

	render(frame_info, scene_info) {
		/* 
		We will collect all objects to draw with this pipeline into an array
		and then run the pipeline on all of them.
		This way the GPU does not need to change the active shader between objects.
		*/
		const entries_to_draw = []

		// Read frame info
		const {mat_projection, mat_view} = frame_info
	
		// For each planet, construct information needed to draw it using the pipeline
		for( const actor of scene_info.actors ) {

			// Choose only planet using this shader
			if (actor.shader_type === 'unshaded') {

				const mat_mvp = mat4.create()

				// #TODO GL1.2.1.2
				// Calculate mat_mvp: model-view-projection matrix	

				mat4_matmul_many(mat_mvp, frame_info.mat_projection, frame_info.mat_view, actor.mat_model_to_world)  

				entries_to_draw.push({
					mat_mvp: mat_mvp,
					tex_base_color: this.resources[actor.texture_name],
				})
			}
		}

		// Draw on the GPU
		this.pipeline(entries_to_draw)
	}
}

