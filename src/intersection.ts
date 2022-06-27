import Vector from "./vector";

/**
 * Class representing a ray-sphere intersection in 3D space
 */
export default class Intersection {
  /**
   * Create an Intersection
   * @param t The distance on the ray
   * @param point The intersection point
   * @param normal The normal in the intersection
   */
  constructor(public t: number, public point: Vector, public normal: Vector) {
    if (t) {
      this.t = t;
    } else {
      this.t = Infinity;
    }
    if (normal) {
      this.normal = normal;
    }
    if (point) {
      this.point = point;
    } else if (point && !normal) {
      this.normal = point.normalize();
    }
  }

  /**
   * Determines whether this intersection
   * is closer than the other
   * @param other The other Intersection
   * @return The result
   */
  closerThan(other: Intersection): boolean {
    if (this.t < other.t) return true;
    else return false;
  }
}
