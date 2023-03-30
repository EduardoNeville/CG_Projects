precision highp float; 

/* #TODO GL3.3.1: Pass on the normals and fragment position in camera coordinates */
varying vec3 norm_cam;
varying vec3 frag_pos_cam;
varying vec2 v2f_uv;


uniform vec3 light_position; // light position in camera coordinates
uniform vec3 light_color;
uniform samplerCube cube_shadowmap;
uniform sampler2D tex_color;

void main() {

	float material_shininess = 12.;

	/* #TODO GL3.1.1
	Sample texture tex_color at UV coordinates and display the resulting color.
	*/
        vec3 material_color = texture2D(tex_color, v2f_uv).rgb;
	
	/*
	#TODO GL3.3.1: Blinn-Phong with shadows and attenuation

	Compute this light's diffuse and specular contributions.
	You should be able to copy your phong lighting code from GL2 mostly as-is,
	though notice that the light and view vectors need to be computed from scratch here; 
	this time, they are not passed from the vertex shader. 

	Also, the light/material colors have changed; see the Phong lighting equation in the handout if you need
	a refresher to understand how to incorporate `light_color` (the diffuse and specular
	colors of the light), `v2f_diffuse_color` and `v2f_specular_color`.
	
	To model the attenuation of a point light, you should scale the light
	color by the inverse distance squared to the point being lit.
	
	The light should only contribute to this fragment if the fragment is not occluded
	by another object in the scene. You need to check this by comparing the distance
	from the fragment to the light against the distance recorded for this
	light ray in the shadow map.
	
	To prevent "shadow acne" and minimize aliasing issues, we need a rather large
	tolerance on the distance comparison. It's recommended to use a *multiplicative*
	instead of additive tolerance: compare the fragment's distance to 1.01x the
	distance from the shadow map.

	Implement the Blinn-Phong shading model by using the passed
	variables and write the resulting color to `color`.

	Make sure to normalize values which may have been affected by interpolation!
	*/

	/*vec4 vertex_position_view = mat_model_view*vec4(vertex_position,1);
	vec4 vertex_normal_view = vec4(mat_normals_to_view*vertex_normal,0);
	vec4 eye_dir = normalize(vec4(0, 0, 0, 1) - vertex_position_view);
	vec4 light_position_d4 = vec4(light_position,1);

	vec4 n_light_dir = normalize(light_position_d4 - vertex_position_view);
	vec4 n_obj_norm = normalize(vertex_normal_view);

	float dot_n_l = dot(n_obj_norm, n_light_dir);

	vec3 mat_d_dot = material_color * dot_n_l;

	if (dot_n_l <= 0.) {
		mat_d_dot = vec3(0.);
	} 

	float spec_dot = 0.;
	// check in light to negative
	vec4 reflected_light = reflect(-n_light_dir, n_obj_norm);
	//vec4 n_dir_cam = vec4(eye_position;

	vec4 half_vec = normalize(eye_dir + n_light_dir);
	
	spec_dot = dot(half_vec, n_obj_norm);
	
	vec3 mat_s_dot = material_color * pow(spec_dot, material_shininess);

	if (dot_n_l <= 0. || spec_dot <= 0.){
		mat_s_dot = vec3(0.);
	}

	color = material_ambient*light_color*material_color + light_color *  (mat_d_dot + mat_s_dot);
	gl_Position = mat_mvp * vec4(vertex_position, 1);*/
	float m_a = 0.1;
	
	vec3 eye_dir = normalize(vec3(0, 0, 0) - frag_pos_cam);

	vec3 n_light_dir = normalize(light_position - frag_pos_cam);
	vec3 n_obj_norm = normalize(norm_cam);

	float dot_n_l = dot(n_obj_norm, n_light_dir);

	vec3 mat_d_dot = material_color * dot_n_l;

	if (dot_n_l <= 0.) {
		mat_d_dot = vec3(0.);
	} 

	float spec_dot = 0.;
	// check in light to negative
	vec3 reflected_light = reflect(-n_light_dir, n_obj_norm);

	vec3 half_vec = normalize(eye_dir + n_light_dir);
	
	spec_dot = dot(half_vec, n_obj_norm);
	
	vec3 mat_s_dot = material_color * pow(spec_dot, material_shininess);

	if (dot_n_l <= 0. || spec_dot <= 0.){
		mat_s_dot = vec3(0.);
	}


	vec3 color = light_color * m_a + light_color *  (mat_d_dot + mat_s_dot) * 1./pow(distance(frag_pos_cam,light_position),2.);
	gl_FragColor = vec4(color, 1.); // output: RGBA in 0..1 range
}
