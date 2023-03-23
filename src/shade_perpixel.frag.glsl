precision mediump float;

/* #TODO GL2.4
	Setup the varying values needed to compue the Phong shader:
	* surface normal
	* lighting vector: direction to light
	* view vector: direction to camera
*/
varying vec3 v2f_normal;
varying vec3 v2f_dir_to_light;
varying vec3 v2f_dir_from_view;

uniform vec3 material_color;
uniform float material_shininess;
uniform vec3 light_color;

void main()
{
	float material_ambient = 0.1;

	/*
	/** #TODO GL2.4: Apply the Blinn-Phong lighting model

	Implement the Blinn-Phong shading model by using the passed
	variables and write the resulting color to `color`.

	Make sure to normalize values which may have been affected by interpolation!
	*/
	vec3 color = material_color * light_color * material_ambient;
        vec3 n_v2f_normal = normalize(v2f_normal);
        vec3 n_v2f_dir_to_light = normalize(v2f_dir_to_light);
        vec3 n_v2f_dir_from_view = normalize(v2f_dir_from_view);
        float diffuse = dot(n_v2f_normal, n_v2f_dir_to_light);
        if (diffuse > 0.) {
                vec3 n_half_vec = normalize(-n_v2f_dir_from_view + n_v2f_dir_to_light);
                float diff_spec = diffuse;
                if (dot(n_v2f_normal, n_half_vec) > 0.) {
                        diff_spec += pow(dot(n_half_vec, n_v2f_normal), material_shininess);
                }
                color += light_color * material_color * diff_spec;
        }
	gl_FragColor = vec4(color, 1.); // output: RGBA in 0..1 range
}
