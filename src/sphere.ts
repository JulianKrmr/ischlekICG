import Vector from "./vector";
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
    (this.center = center), (this.radius = radius), (this.color = color);
  }

  /**
   * Calculates the intersection of the sphere with the given ray
   * @param ray The ray to intersect with
   * @return The intersection if there is one, null if there is none
   */
  intersect(ray: Ray): Intersection | null {
    var x0: Vector = ray.origin.sub(this.center);
    var c: number =
      Math.pow(x0.dot(ray.direction), 2) -
      x0.dot(x0) +
      this.radius * this.radius;

    if (c < 0) {
      return null;
    }

    var normal: Vector = ray.direction;

    var t1: number =
      -ray.origin.dot(ray.direction) +
      Math.sqrt(
        Math.pow(ray.origin.dot(ray.direction), 2) -
          ray.origin.dot(ray.origin) +
          this.radius * this.radius
      );

    var t2: number =
      -ray.origin.dot(ray.direction) -
      Math.sqrt(
        Math.pow(ray.origin.dot(ray.direction), 2) -
          ray.origin.dot(ray.origin) +
          this.radius * this.radius
      );

    var intersection1: Intersection = new Intersection(
      t1,
      ray.origin.add(ray.direction.mul(t1)),
      normal
    );
    var intersection2: Intersection = new Intersection(
      t2,
      ray.origin.add(ray.direction.mul(t2)),
      normal
    );
    if (intersection1.closerThan(intersection2)) {
      return intersection1;
    } else {
      return intersection2;
    }
  }
}
