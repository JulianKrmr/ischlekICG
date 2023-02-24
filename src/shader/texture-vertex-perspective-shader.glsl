attribute vec3 a_position;
attribute vec2 a_texCoord;
attribute vec3 a_normal;
attribute vec3 a_tangent;
attribute vec3 a_bitangent;

varying vec2 v_texCoord;
varying vec4 v_position;
varying vec3 v_normal;
varying vec3 v_tangent;
varying vec3 v_bitangent;

uniform mat4 M;
uniform mat4 V;
uniform mat4 P;
uniform mat4 N;


void main() {
  gl_Position = P * V * M * vec4(a_position, 1.0);
  v_texCoord = a_texCoord;
  v_position= ((V * M  * vec4(a_position, 1.0)));

  v_normal = normalize(( V* N * vec4(a_normal, 0)).xyz);
  v_tangent = normalize( V* N* normalize(vec4(a_tangent, 0.0))).xyz;
  v_bitangent = normalize(V* N * normalize(vec4(a_bitangent, 0.0))).xyz;
}
