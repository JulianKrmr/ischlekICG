attribute vec3 a_position;
// TODO
uniform mat4 M;

void main() {
  gl_Position = M*vec4(a_position, 1.0);
  // TODO
}
