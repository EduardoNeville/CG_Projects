precision highp float; 

/* #TODO GL3.3.1: Pass on the normals and fragment position in camera coordinates */
varying vec3 v2f_normal;
varying vec3 v2f_position_view;

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

	float m_a = 0.1;
	
	vec3 color = material_color * light_color * m_a;
	
	vec3 n_v2f_normal = normalize(v2f_normal);
	vec3 n_v2f_dir_to_light = normalize(light_position - v2f_position_view);
	vec3 n_v2f_dir_from_view = normalize(v2f_position_view);
	float dist_light_pos = distance(v2f_position_view,light_position);
	float diffuse = dot(n_v2f_normal, n_v2f_dir_to_light);
	float z_buffer = distance(textureCube(cube_shadowmap,-n_v2f_dir_to_light),vec4(0.,0.,0.,0));
	
	if (z_buffer>dist_light_pos){
		if (diffuse > 0.) {
			vec3 n_half_vec = normalize(-n_v2f_dir_from_view + n_v2f_dir_to_light);
			float diff_spec = diffuse;
			if (dot(n_v2f_normal, n_half_vec) > 0.) {
				diff_spec += pow(dot(n_half_vec, n_v2f_normal), material_shininess);
			}
			color += light_color * material_color * diff_spec * 1./pow(dist_light_pos,2.);
		}
	}
	
	gl_FragColor = vec4(color, 1.); // output: RGBA in 0..1 range
	
}
