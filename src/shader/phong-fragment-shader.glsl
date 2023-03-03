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
   // calculate diffuse
   // It first calculates the direction of the light from the current pixel, and then calculates the dot product 
   // of this direction with the surface normal. This dot product gives the cosine of the angle between the
   // light direction and the surface normal, which is then clamped to a minimum value of 0.0
   // to avoid negative contributions. 
   // The resulting value is multiplied by the vertex color and the diffuse coefficient "kD" to give the diffuse contribution.
         float currentDiffuse = max(dot(lightDirection, norm), 0.0);
         diffuse += currentDiffuse * v_color.rgb * kD;

    // calculate specular
    // The shader then calculates the reflection direction of the light by reflecting the negated light direction
    // around the surface normal. It then calculates the dot product of the reflection direction with the view direction
    // (the direction from the current pixel to the camera), which gives the cosine of the angle between the 
    // reflection direction and the view direction. This cosine is raised to the power of the
    // shininess coefficient to give the specular contribution. The resulting value is multiplied by the vertex 
    // color and the specular coefficient "kS" to give the specular contribution.

         vec3 viewDir = normalize(cameraPos.xyz - v_position.xyz);
         vec3 reflectDir = reflect(-lightDirection, norm);
         float currentSpecular = pow(max(dot(viewDir, reflectDir), 0.0), shininess);

         specular += currentSpecular * v_color.rgb * kS;
    }

         gl_FragColor = vec4 (ambient + diffuse + specular, 1.0);
}
