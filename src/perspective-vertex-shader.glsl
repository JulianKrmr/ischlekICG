attribute vec3 a_position;
// TODO
uniform mat4 M;
uniform mat4 V;
uniform mat4 P;

void main() {
  gl_Position = P*V * M*vec4(a_position, 1.0);
  // TODO
}
