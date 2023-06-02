import {createREGL} from "../lib/regljs_2.1.0/regl.module.js"
import {vec2, vec3, vec4, mat2, mat3, mat4} from "../lib/gl-matrix_3.3.0/esm/index.js"

import {DOM_loaded_promise, load_text, load_texture, register_button_with_hotkey, register_keyboard_action} from "./icg_web.js"
import {deg_to_rad, mat4_to_string, vec_to_string, mat4_matmul_many} from "./icg_math.js"
import {icg_mesh_make_uv_sphere} from "./icg_mesh.js"

import {init_noise} from "./noise.js"
import {init_terrain} from "./terrain.js"
import {init_particle_system} from "./particle_emitter.js"
import {init_asteroid} from "./asteroid.js"


async function main() {
	/* const in JS means the variable will not be bound to a new value, but the value can be modified (if its an object or array)
		https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const
	*/

	const debug_overlay = document.getElementById('debug-overlay')

	// We are using the REGL library to work with webGL
	// http://regl.party/api
	// https://github.com/regl-project/regl/blob/master/API.md

	const regl = createREGL({ // the canvas to use
		profile: true, // if we want to measure the size of buffers/textures in memory
		extensions: ['oes_texture_float'], // enable float textures
    container: document.getElementById('demo-container'), // Set container
	})

	// The <canvas> (HTML element for drawing graphics) was created by REGL, lets take a handle to it.
	const canvas_elem = document.getElementsByTagName('canvas')[0]


	let update_needed = true

	{
		// Resize canvas to fit the window, but keep it square.
		function resize_canvas() {
			canvas_elem.width = window.innerWidth
			canvas_elem.height = window.innerHeight

			update_needed = true
		}
		resize_canvas()
		window.addEventListener('resize', resize_canvas)
	}

	/*---------------------------------------------------------------
		Resource loading
	---------------------------------------------------------------*/

	/*
	The textures fail to load when the site is opened from local file (file://) due to "cross-origin".
	Solutions:
	* run a local webserver
		caddy file-server -browse -listen 0.0.0.0:8000 -root .
		# or
		python -m http.server 8000
		# open localhost:8000
	OR
	* run chromium with CLI flag
		"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --allow-file-access-from-files index.html

	* edit config in firefox
		security.fileuri.strict_origin_policy = false
	*/

	// Start downloads in parallel
	const resources = {};

	[
		"noise.frag.glsl",
		"display.vert.glsl",

		"terrain.vert.glsl",
		"terrain.frag.glsl",

		"buffer_to_screen.vert.glsl",
		"buffer_to_screen.frag.glsl",

    "asteroid.vert.glsl",
    "asteroid.frag.glsl",

    "unshaded.vert.glsl",
    "unshaded.frag.glsl",

    "particle_glow.vert.glsl",
		"particle_glow.frag.glsl",

    "particle_default.vert.glsl",
		"particle_default.frag.glsl",

	].forEach((shader_filename) => {
		resources[`shaders/${shader_filename}`] = load_text(`./src/shaders/${shader_filename}`);
	});

  
  resources[`noise/perlin`] = load_texture(regl, 'src/noise/perlin.png');
  resources[`noise/smoke`] = load_texture(regl, 'src/noise/smoke.png');
  resources[`noise/fbm`] = load_texture(regl, 'src/noise/fbm.png');
  resources[`noise/fbm_zoomed`] = load_texture(regl, 'src/noise/fbm_zoomed.png');
  resources[`noise/turbulence`] = load_texture(regl, 'src/noise/turbulence.png');
  resources[`noise/particle`] = load_texture(regl, 'src/noise/particle.png');
  resources['tex/moonColor.jpeg'] = load_texture(regl, 'textures/moonColor.jpeg');


	// Wait for all downloads to complete
	for (const key of Object.keys(resources)) {
		resources[key] = await resources[key];
	}

  // Construct a unit sphere mesh
	// UV sphere https://docs.blender.org/manual/en/latest/modeling/meshes/primitives.html#uv-sphere
	// we create it in code instead of loading from a file
	resources['mesh_uvsphere'] = icg_mesh_make_uv_sphere(15);


	/*---------------------------------------------------------------
		Camera
	---------------------------------------------------------------*/
	const mat_turntable = mat4.create()
	const cam_distance_base = 0.75

	let cam_angle_z = -0.5 // in radians!
	let cam_angle_y = -0.42 // in radians!
	let cam_distance_factor = 1.

	let cam_target = [0, 0, 0]
  let cam_follow = false

	function update_cam_transform() {
		/* #TODO PG1.0 Copy camera controls
		* Copy your solution to Task 2.2 of assignment 5.
		Calculate the world-to-camera transformation matrix.
		The camera orbits the scene
		* cam_distance_base * cam_distance_factor = distance of the camera from the (0, 0, 0) point
		* cam_angle_z - camera ray's angle around the Z axis
		* cam_angle_y - camera ray's angle around the Y axis

		* cam_target - the point we orbit around
		*/

    const r = cam_distance_base*cam_distance_factor

		// Example camera matrix, looking along forward-X, edit this
    const look_at = mat4.lookAt(mat4.create(), 
                                [-r, 0, 0],
                                [0, 0, 0], // view target point
                                [0, 0, 1], // up vector
                               )
    // Store the combined transform in mat_turntable
    const M_rot_z = mat4.fromZRotation(mat4.create(), cam_angle_z)
    const M_rot_y = mat4.fromYRotation(mat4.create(), cam_angle_y)
    const M_trans = mat4.fromTranslation(mat4.create(), vec3.negate([0,0,0], cam_target))
    //frame_info.mat_turntable = A * B * ...
    mat4_matmul_many(mat_turntable, look_at,M_rot_y, M_rot_z, M_trans)
  }

	update_cam_transform()

	// Prevent clicking and dragging from selecting the GUI text.
	canvas_elem.addEventListener('mousedown', (event) => { event.preventDefault() })

	// Rotate camera position by dragging with the mouse
	canvas_elem.addEventListener('mousemove', (event) => {
		// if left or middle button is pressed
		if (event.buttons & 1 || event.buttons & 4) {
      if (event.shiftKey) {
			  if (cam_follow) {
          cam_target = vec3.clone(cam_target);
          cam_follow = false;
        }
				const r = mat2.fromRotation(mat2.create(), -cam_angle_z)
				const offset = vec2.transformMat2([0, 0], [event.movementY, event.movementX], r)
				vec2.scale(offset, offset, -0.01)
				cam_target[0] -= offset[0]
				cam_target[1] -= offset[1]
			} else {
				cam_angle_z += event.movementX*0.005
				cam_angle_y += -event.movementY*0.005
			}
			update_cam_transform()
			update_needed = true
		}

	})

	canvas_elem.addEventListener('wheel', (event) => {
		// scroll wheel to zoom in or out
		const factor_mul_base = 1.08
		const factor_mul = (event.deltaY > 0) ? factor_mul_base : 1./factor_mul_base
		cam_distance_factor *= factor_mul
		cam_distance_factor = Math.max(0.1, Math.min(cam_distance_factor, 4))
		// console.log('wheel', event.deltaY, event.deltaMode)
		event.preventDefault() // don't scroll the page too...
		update_cam_transform()
		update_needed = true
	}, {passive: false})

	/*---------------------------------------------------------------
		Actors
	---------------------------------------------------------------*/

	const noise_textures = init_noise(regl, resources)

	const texture_fbm = (() => {
		for(const t of noise_textures) {
			//if(t.name === 'FBM') {
			if(t.name === 'FBM_for_terrain') {
				return t
			}
		}
	})()

	texture_fbm.draw_texture_to_buffer({width: 192, height: 192, mouse_offset: [-5.24, 8.15]})

	const terrain_actor = init_terrain(regl, resources, texture_fbm.get_buffer())
  const asteroid_actor = init_asteroid(regl, resources, {
    size: 0.01,
    start_point: [.3, .3, .5],
    end_point: [0., 0., -.03],
    speed: 0.01,
    texture_name: "moonColor.jpeg",
  });
  
  const particles = {};
  
/*  particles.push(init_particle_system(regl, resources, {
    size: 0.01,
    type: "glow",
    position: [0., 0., 0.5],
    velocity: [0., 0., -0.1],
    count: 100,
    initial_count: 10,
    frequency: 0.01,
    lifetime: 3,
    rand_scale: 0.03,
    }));*/

  const smoke_tail = {
    size: 0.005,
    type: "fbm",
    position: asteroid_actor.position,
    velocity: [0.1, 0.1, 0.17],
    system_velocity: [0., 0., 0.],
    count: 5000,
    initial_count: 10,
    frequency: 0.001,
    spawn_count: 50,
    lifetime: 1.5,
    rand_pos: 0.005,
    rand_velocity: 0.006,
    start_color: [0.3, 0.3, 0.3, 1.0],
    end_color: [0.7, 0.7, 0.7, 0.5],
  };
  particles['smoke'] = init_particle_system(regl, resources, smoke_tail);


  // Fire tail
  const fire_tail = {
    size: 0.005,
    type: "turbulence",
    position: asteroid_actor.position,
    velocity: [0.02, 0.02, 0.034],
    system_velocity: [0., 0., 0.],
    count: 5000,
    initial_count: 10,
    frequency: 0.0001,
    spawn_count: 50,
    lifetime: 2.,
    rand_pos: 0.01,
    rand_velocity: 0.005,
    start_color: [1., 0.4, 0., 1.0],
    end_color: [1., 1., 0., 0.5],
  };
  particles['fire'] = init_particle_system(regl, resources, fire_tail);
  

	/*
		UI
	*/
	register_keyboard_action('z', () => {
		debug_overlay.classList.toggle('hide')
	})


	function activate_preset_view() {
		cam_angle_z = -1.0
		cam_angle_y = -0.42
		cam_distance_factor = 1.0
		cam_target = [0, 0, 0]
		
		update_cam_transform()
		update_needed = true
	}
	register_button_with_hotkey('btn-preset-view', '1', activate_preset_view)

  function activate_follow_asteroid() {
    cam_angle_z = -1.855;
    cam_angle_y = -0.51;
    cam_distance_factor = 0.1;

    cam_target = asteroid_actor.position;
    cam_follow = true;
  }
  activate_follow_asteroid();
  register_button_with_hotkey('btn-follow-asteroid', '2', activate_follow_asteroid);

  function toggle_fire() {
    particles['fire'].enabled = !particles['fire'].enabled;
  }
  register_button_with_hotkey('btn-toggle-fire', 'f', toggle_fire);

  function toggle_smoke() {
    particles['smoke'].enabled = !particles['smoke'].enabled;
  }
  register_button_with_hotkey('btn-toggle-smoke', 's', toggle_smoke);

  let is_paused = true;
	let sim_time = 0;
  let delta = 0;
	let prev_regl_time = 0;
  
	register_keyboard_action('p', () => is_paused = !is_paused);

	/*---------------------------------------------------------------
		Frame render
	---------------------------------------------------------------*/
	const mat_projection = mat4.create()
	const mat_view = mat4.create()

	let light_position_world = [0.2, -0.3, 0.8, 1.0]
	//let light_position_world = [1, -1, 1., 1.0]

	const light_position_cam = [0, 0, 0, 0]
  const camera_position = [0,0,0]

	regl.frame((frame) => {
		if (! is_paused) {
			delta = frame.time - prev_regl_time;
			sim_time += delta;
		}
		prev_regl_time = frame.time;
    
		mat4.perspective(mat_projection,
				             deg_to_rad * 60, // fov y
				             frame.framebufferWidth / frame.framebufferHeight, // aspect ratio
				             0.01, // near
				             100, // far
			              )
    
		mat4.copy(mat_view, mat_turntable)
    
		// Calculate light position in camera frame
		vec4.transformMat4(light_position_cam, light_position_world, mat_view)
    
		const mat_camera_to_world = mat4.invert(mat4.create(), mat_view);
    
		mat4.getTranslation(camera_position, mat_camera_to_world);
    
    
		const scene_info = {
      sim_time:            sim_time,
      delta_time:          delta,
			mat_view:            mat_view,
			mat_projection:      mat_projection,
			light_position_cam:  light_position_cam,
      camera_position:     camera_position,
		}
    
    asteroid_actor.calculate_model_matrix(scene_info);

    if (cam_follow) {
      update_cam_transform();
    }

    // Set the whole image to black
		regl.clear({color: [0.9, 0.9, 1., 1]})
    
		terrain_actor.draw(scene_info);

    asteroid_actor.draw(scene_info);
    
    for (const name in particles) {
      const system = particles[name];
      if (system.enabled) {
        system.calculate_model_matrix(scene_info);
        system.draw(scene_info);
      }
		}

    // 		debug_text.textContent = `
    // Hello! Sim time is ${sim_time.toFixed(2)} s
    // Camera: angle_z ${(cam_angle_z / deg_to_rad).toFixed(1)}, angle_y ${(cam_angle_y / deg_to_rad).toFixed(1)}, distance ${(cam_distance_factor*cam_distance_base).toFixed(1)}
    // `
  })
}

DOM_loaded_promise.then(main)
