precision mediump float;
// Per-vertex outputs passed on to the fragment shader
varying vec2 v2f_tex_coord;

uniform sampler2D noise_tex;
uniform vec4 color;

void main()
{
//        vec3 color = vec3(1., 0., 0.);
        float alpha_from_texture = texture2D(noise_tex, v2f_tex_coord).r;

        float alpha_dist = 2. - pow(2., distance(v2f_tex_coord, vec2(.5, .5)));
        float alpha_res = alpha_from_texture * alpha_dist;
        
        if (color.a * alpha_res < 0.5) {
                discard;
        }

	gl_FragColor = vec4(color.rgb, color.a * alpha_res);
}
