precision mediump float;

// Receive color and position values
// TODO
varying vec4 v_color;
varying vec3 v_normal;
varying vec4 v_position;



const vec3 lightPos = vec3(1.0, 1.0, 1.0);
const float shininess = 16.0;
const float kA = 0.3;
const float kD = 0.6;
const float kS = 0.7;
const vec3 cameraPos = vec3(0.0, 0.0, 1.0);

const vec3 s = lightPos - v_position;
const vec3 n = v_normal;
const vec3 v = cameraPos - normalize(v_position);
const vec3 r = reflect(v, n);

void main(void) {
    vec3 ambient = kA * v_color.rgb;
    vec3 diffuse = kD * v_color.rgb * max(dot(n, s), 0.0);
    vec3 specular = kS * v_color.rgb * pow(max(dot(r, v), 0.0), shininess);
    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);


}
