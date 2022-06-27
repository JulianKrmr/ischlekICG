import Vector from "./vector";
import Intersection from "./intersection";

/**
 * Calculate the colour of an object at the intersection point according to the Phong Lighting model.
 * @param color The colour of the intersected object
 * @param intersection The intersection information
 * @param lightPositions The light positions
 * @param shininess The shininess parameter of the Phong model
 * @param cameraPosition The position of the camera
 * @return The resulting colour
 */
export default function phong(
  color: Vector,
  intersection: Intersection,
  lightPositions: Array<Vector>,
  shininess: number,
  cameraPosition: Vector
): Vector {
  const lightColor = new Vector(0.8, 0.8, 0.8, 0);
  const kA = 0.8;
  const kD = 0.5;
  const kS = 0.5;
  // TODO
  const ambient = color.mul(kA);
  let sumOfLights = 
  const diffuse = kD * sumOfLights;

  return ambient;
}
