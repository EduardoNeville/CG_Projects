// Vertex attributes, specified in the "attributes" entry of the pipeline
attribute vec3 vertex_position;
attribute vec3 vertex_normal;


// Per-vertex outputs passed on to the fragment shader



/* #TODO GL2.3
	Pass the values needed for per-pixel
	Create a vertex-to-fragment variable.
*/
//varying ...
varying vec3 vertex_to_fragment;
varying vec3 color;

// Global variables specified in "uniforms" entry of the pipeline
uniform mat4 mat_mvp;
uniform mat4 mat_model_view;
uniform mat3 mat_normals_to_view;

uniform vec3 light_position; //in camera space coordinates already

uniform vec3 material_color;
uniform float material_shininess;
uniform vec3 light_color;


void main() {
	float material_ambient = 0.1;

	/** #TODO GL2.3 Gouraud lighting
	Compute the visible object color based on the Blinn-Phong formula.

	Hint: Compute the vertex position, normal and light_position in eye space.
	Hint: Write the final vertex position to gl_Position
	*/

	/*In the Gouraud shading model, we compute the lighting value for 
	each vertex in the vertex shader, store the resulting color and interpolate 
	it over the drawn triangle.*/

	vec4 vertex_position_view = mat_model_view*vec4(vertex_position,1);
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
	gl_Position = mat_mvp * vec4(vertex_position, 1);

	
}
