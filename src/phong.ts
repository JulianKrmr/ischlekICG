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

  let sumOfLightsDiffuse: Vector = new Vector(0, 0, 0, 0);
  let sumOfLightsSpecular: Vector = new Vector(0, 0, 0, 0);

  //berechnung für jede lichtquelle
  lightPositions.forEach((light) => {
    let s: Vector = light.sub(intersection.point).normalize(); //light vector
    let n: Vector = intersection.normal; //normal vector
    let v: Vector = cameraPosition.sub(intersection.point).normalize(); //camera Vector
    let r: Vector = intersection.normal.mul(s.dot(n)).mul(2).sub(s);

    //berechnung diffuse Anteil
    sumOfLightsDiffuse = sumOfLightsDiffuse.add(
      lightColor.mul(Math.max(0, n.dot(s)))
    );
    //berechnung specular Anteil
    sumOfLightsSpecular = sumOfLightsSpecular.add(
      lightColor.mul(Math.pow(Math.max(0, r.dot(v)), shininess))
    );
  });

  let ambient: Vector = color.mul(kA);
  let diffuse: Vector = sumOfLightsDiffuse.mul(kD);
  let specular: Vector = sumOfLightsSpecular.mul(kS);

  return ambient.add(diffuse).add(specular);
}