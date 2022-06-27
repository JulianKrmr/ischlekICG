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
  let sumOfDiffuseLights: Vector = new Vector(0, 0, 0, 0);
  let sumOfSpecularLights: Vector = new Vector(0, 0, 0, 0);
  lightPositions.forEach((light) => {
    const helper = light.normalize().dot(intersection.normal);
    const helper1 = intersection.normal.mul(helper).mul(2);
    const r = helper1.sub(light.normalize());
    sumOfSpecularLights = sumOfSpecularLights.add(
      lightColor.mul(Math.pow(r.dot(cameraPosition.normalize()), shininess))
    );
    sumOfDiffuseLights = sumOfDiffuseLights.add(
      lightColor.mul(Math.max(0, intersection.normal.dot(light)))
    );
  });
  const diffuse = sumOfDiffuseLights.mul(kD);

  const specular = sumOfSpecularLights.mul(kS);
  color = ambient.add(diffuse).add(specular);
  return color;
}
