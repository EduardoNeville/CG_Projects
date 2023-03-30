// Vertex attributes, specified in the "attributes" entry of the pipeline
attribute vec3 vertex_position;
attribute vec3 vertex_normal;
attribute vec2 vertex_tex_coords;


// Per-vertex outputs passed on to the fragment shader

/* #TODO GL3.3.1: Pass on the normals and fragment position in camera coordinates */
varying vec3 v2f_normal;
varying vec3 v2f_dir_to_light;
varying vec3 v2f_dir_from_view;
varying vec3 norm_cam;
varying vec3 frag_pos_cam; 
varying vec2 v2f_uv;

// Global variables specified in "uniforms" entry of the pipeline
uniform mat4 mat_mvp;
uniform mat4 mat_model_view;
uniform mat3 mat_normals_to_view;

uniform vec3 light_position; //in camera space coordinates already

void main() {
	v2f_uv = vertex_tex_coords;

	/** #TODO GL3.3.1
	Setup all outgoing variables so that you can compute in the fragment shader
    the phong lighting. You will need to setup all the uniforms listed above, before you
    can start coding this shader.
	* surface normal
	* vertex position in camera coordinates
    Hint: Compute the vertex position, normal and light_position in eye space.
    Hint: Write the final vertex position to gl_Position
    */
	// viewing vector (from camera to vertex in view coordinates), camera is at vec3(0, 0, 0) in cam coords
	// vertex position in camera coordinates
	// transform normal to camera coordinates

        vec3 vertex_view_pos = vec3(mat_model_view * vec4(vertex_position, 1));
	// viewing vector (from camera to vertex in view coordinates), camera is at vec3(0, 0, 0) in cam coords
	v2f_dir_from_view = vertex_view_pos;
	// direction to light source
        v2f_dir_to_light = light_position - vertex_view_pos;
        // transform normal to camera coordinates
	v2f_normal = mat_normals_to_view * vertex_normal;
	//Compute the vertex position, normal and light_position in camera space
	norm_cam = vec3(mat_model_view*vec4(vertex_position,1));
	frag_pos_cam = vec3(mat_model_view*vec4(vertex_normal,0));
	//vec4 cam_direction = normalize(vec4(0, 0, 0, 1) - vertex_position_cam);
	
	gl_Position = mat_mvp*vec4(vertex_position, 1);

}
