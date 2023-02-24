precision mediump float;

uniform sampler2D sampler;
uniform sampler2D normalSampler;
varying vec2 v_texCoord;
varying vec4 v_position;
varying vec3 v_normal;
varying vec3 v_tangent;
varying vec3 v_bitangent;

uniform float shininess;
uniform float kA;
uniform float kD;
uniform float kS;

vec3 ambient=vec3(0, 0, 0);
vec3 diffuse=vec3(0, 0, 0);
vec3 specular=vec3(0, 0, 0);

const vec3 lightColor=vec3(0.8, 0.8, 0.8);
const vec4 cameraPos = vec4(0.0, 0.0, 0.0, 1.0);

uniform vec3 LightPositions[8];
uniform int numberOfLights;

void main(void) {
  vec4 texel = texture2D(sampler, vec2(v_texCoord.s, v_texCoord.t));
  vec3 texelColor = texel.xyz;

  vec4 normalTexture = texture2D(normalSampler, vec2(v_texCoord.s, v_texCoord.t));
  vec3 z_tangent =  normalize(v_tangent);
  vec3 z_bitangent =  normalize(v_bitangent);
  vec3 z_normal = normalize(v_normal);

  mat3 TangentBitangentNormal = mat3(
  z_tangent.x, z_tangent.y, z_tangent.z,
  z_bitangent.x, z_bitangent.y, z_bitangent.z,
  z_normal.x, z_normal.y, z_normal.z
  );

  ambient = kA * texelColor;

  vec3 norm = normalize(TangentBitangentNormal * ((normalTexture.xyz * 2.0) -1.0));

  for(int i = 0; i < 8; i++){
    // calculate diffuse
    if (i >= numberOfLights){ break; }
    vec3 lightDirection = normalize(LightPositions[i] - v_position.xyz);
    float currentDiffuse = max(dot(lightDirection, norm), 0.0);
    diffuse += currentDiffuse * texelColor * kD;

    // calculate specular

    vec3 viewDir = normalize(cameraPos.xyz - v_position.xyz);
    vec3 reflectDir = reflect(-lightDirection, norm);
    float currentSpecular = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    specular += currentSpecular * texelColor * kS;
  }

  // Read fragment color from texture
  //gl_FragColor = texture2D(sampler, v_texCoord);
  gl_FragColor = vec4( ambient+ diffuse + specular, 1.0);
}
