precision mediump float;
// Per-vertex outputs passed on to the fragment shader
varying vec2 v2f_tex_coord;

uniform sampler2D noise_tex;
uniform vec4 color;

void main()
{
//        vec3 color = vec3(1., 0., 0.);
        float alpha_from_texture = texture2D(noise_tex, v2f_tex_coord).r;
	gl_FragColor = vec4(color.rgb, color.a * alpha_from_texture);
}
