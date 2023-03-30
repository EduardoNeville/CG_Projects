precision mediump float;

/* #TODO GL3.2.3
	Setup the varying values needed to compue the Phong shader:
	* surface normal
	* view vector: direction to camera
*/
varying vec3 v2f_dir_from_camera;
varying vec3 v2f_normal;

uniform samplerCube cube_env_map;

void main()
{
	/*
	/* #TODO GL3.2.3: Mirror shader
	Calculate the reflected ray direction R and use it to sample the environment map.
	Pass the resulting color as output.
	*/
        vec3 n_v2f_dir_from_camera = normalize(v2f_dir_from_camera);
        vec3 n_v2f_normal = normalize(v2f_normal);
        
        vec3 reflected = reflect(n_v2f_dir_from_camera, n_v2f_normal);

        vec3 color = vec3(textureCube(cube_env_map, reflected));
        
	gl_FragColor = vec4(color, 1.); // output: RGBA in 0..1 range
}
