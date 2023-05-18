precision mediump float;
// Per-vertex outputs passed on to the fragment shader
varying vec2 v2f_tex_coord;

uniform sampler2D noise_tex;

void main()
{
        vec4 color_from_texture = texture2D(noise_tex, v2f_tex_coord);
	gl_FragColor = color_from_texture;
}
