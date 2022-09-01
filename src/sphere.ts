import Vector from "./math/vector";
import Intersection from "./intersection";
import Ray from "./ray";

/**
 * A class representing a sphere
 */
export default class Sphere {
  /**
   * Creates a new Sphere with center and radius
   * @param center The center of the Sphere
   * @param radius The radius of the Sphere
   * @param color The colour of the Sphere
   */
  constructor(
    public center: Vector,
    public radius: number,
    public color: Vector
  ) {
    this.center = center;
    this.radius = radius;
    this.color = color;
  }

  /**
   * Calculates the intersection of the sphere with the given ray
   * @param ray The ray to intersect with
   * @return The intersection if there is one, null if there is none
   */
  intersect(ray: Ray): Intersection | null {
    const x0 = ray.origin.sub(this.center); //Translate ray about -center
    const c =
      Math.pow(x0.dot(ray.direction.normalize()), 2) -
      Math.pow(x0.length, 2) +
      Math.pow(this.radius, 2); //calculate the discremenant to determine how many intersections there are
    if (c < 0) {
      //Keine Intersections
      return null;
    }

    const t1 = -x0.dot(ray.direction.normalize()) + Math.sqrt(c); //calculate distance +/- c with p-q Formula
    const t2 = -x0.dot(ray.direction.normalize()) - Math.sqrt(c);

    const closest = Math.min(t1, t2); //Abstand zur Kugel
    let intersectionPoint = ray.origin.add(ray.direction.mul(closest)); //Kollisions Punkt
    let direction = intersectionPoint.sub(this.center).normalize(); //richtung des Normalenvektors

    return new Intersection(closest, intersectionPoint, direction);
  }
}
