precision mediump float;

attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec4 a_color;

// Pass color as attribute and forward it
// to the fragment shader
// TODO

uniform mat4 M; // Model matrix
uniform mat4 V; // View matrix
uniform mat4 N; // normal matrix

varying vec3 v_normal;
varying vec4 v_color;
varying vec4 v_position;

// Pass the vertex position in view space
// to the fragment shader
// TODO

void main() {
  gl_Position = V * M * vec4(a_position, 1.0);
  
  // Pass the color and transformed vertex position through
  // TODO
  v_position = V * M * vec4(a_position, 1.0);
  v_color = a_color;
  v_normal = normalize((V * N * vec4(a_normal, 0)).xyz);
}