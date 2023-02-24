precision mediump float;
varying vec4 v_position;
varying vec4 v_color;
varying vec3 v_normal;

uniform float shininess;
uniform float kA;
uniform float kD;
uniform float kS;

vec3 ambient=vec3(0, 0, 0);
vec3 diffuse=vec3(0, 0, 0);
vec3 specular=vec3(0, 0, 0);

// Receive color and position values
const vec3 lightColor=vec3(0.8, 0.8, 0.8);
const vec4 cameraPos = vec4(0.0, 0.0, 0.0, 1.0);

uniform vec3 LightPositions[8];
uniform int numberOfLights;

void main(void) {



    ambient = kA * v_color.rgb;

    vec3 norm = normalize(v_normal);

    // iterate over all light positons (max 8), break if numberOfLights is reached
    for(int i = 0; i < 8; i++) {
      if (i >= numberOfLights){ break; }
         vec3 lightDirection = normalize(LightPositions[i] - v_position.xyz);
    //     // calculate diffuse
         float currentDiffuse = max(dot(lightDirection, norm), 0.0);
         diffuse += currentDiffuse * v_color.rgb * kD;

    //     // calculate specular
         vec3 viewDir = normalize(cameraPos.xyz - v_position.xyz);
         vec3 reflectDir = reflect(-lightDirection, norm);
         float currentSpecular = pow(max(dot(viewDir, reflectDir), 0.0), shininess);

         specular += currentSpecular * v_color.rgb * kS;
    // }
    }

    //     vec3 diffuse = kD * v_color.rgb * max(dot(n, s), 0.0);
    //     vec3 specular = kS * v_color.rgb * pow(max(dot(v, r), 0.0), shininess);

         gl_FragColor = vec4 (ambient + diffuse + specular, 1.0);
}
