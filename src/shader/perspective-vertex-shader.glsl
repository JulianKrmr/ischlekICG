attribute vec3 a_position;
uniform mat4 M;
uniform mat4 V;
uniform mat4 P;

attribute vec3 a_normal;
attribute vec4 a_color;

uniform mat4 N; // normal matrix

varying vec3 v_normal;
varying vec4 v_color;
varying vec4 v_position;


void main() {
  gl_Position = P*V * M*vec4(a_position, 1.0);
  v_position = V * M * vec4(a_position, 1.0);
  v_color = a_color;
  v_normal = normalize((V * N * vec4(a_normal, 0)).xyz);
}
