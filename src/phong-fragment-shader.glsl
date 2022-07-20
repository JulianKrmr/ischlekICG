precision mediump float;

// Receive color and position values
// TODO

varying vec3 v_normal;

const vec3 lightPos = vec3(1.0, 1.0, 1.0);
const float shininess = 16.0;
const float kA = 0.3;
const float kD = 0.6;
const float kS = 0.7;

void main(void) {
  gl_FragColor = vec4(0.0, 0.0, 0.5, 1.0);
  // Phong lighting calculation
  // TODO
}
