precision mediump float;

// Receive color and position values
// TODO
varying vec4 v_color;
varying vec3 v_normal;
varying vec4 v_position;

const vec4 lightPos = vec4(1.0, 1.0, 1.0, 1.0);
const float shininess = 16.0;
const float kA = 0.3;
const float kD = 0.6;
const float kS = 0.7;
const vec4 cameraPos = vec4(0.0, 0.0, 0.0, 1.0);


void main(void) {
vec4 s = normalize(lightPos - v_position);
vec4 n = vec4(v_normal, 0.0);
vec4 v = normalize(cameraPos - v_position);
vec4 r = normalize(reflect(-s, n));
// vec4 r = reflect(-s, n);


vec3 ambient = kA * v_color.rgb;
vec3 diffuse = kD * v_color.rgb * max(dot(n, s), 0.0);
vec3 specular = kS * v_color.rgb * pow(max(dot(v, r), 0.0), shininess);

gl_FragColor = vec4 (ambient + diffuse + specular, 1.0);



}
