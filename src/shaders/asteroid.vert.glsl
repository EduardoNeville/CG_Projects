precision mediump float;

attribute vec4 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uMvpMatrix;
uniform mat4 uModelMatrix;    // Model matrix
uniform mat4 uNormalMatrix;   // Transformation matrix of the normal

uniform sampler2D displacementMap;

out vec2 vTexCoord;
out vec3 vNormal;
out vec3 vPosition;


void main() {
  float disp;

  disp = texture(displacementMap, aTexCoord).r; 
  vec4 displace = aPosition;

  float displaceFactor = 0.1;
  float displaceBias = 0.0;

  displace.xyz += (displaceFactor * disp - displaceBias) * aNormal;
  gl_Position = uMvpMatrix * displace;

  // Calculate the vertex position in the world coordinate
  vPosition = vec3(uModelMatrix * aPosition);

  vNormal = normalize(mat3(uNormalMatrix) * aNormal);
  vTexCoord = aTexCoord;

}
