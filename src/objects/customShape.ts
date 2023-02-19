import Vector from "../math/vector";
import Ray from "src/math/ray";
import Intersection from "src/math/intersection";
import Plane from "../math/plane";

/**
 * Class representing a Pyramid
 */
export default class CustomShape {
  /**
   * The pyramids vertices
   */
  vertices: Array<Vector>;
  indices: Array<number>;

  constructor(vertieces: Vector[], indices: number[], public color: Vector) {
    this.color = color;
    this.vertices = vertieces;
    this.indices = indices;
  }

  /**
   * Calculates the intersection of the Pyramid with the given ray
   * @param ray The ray to intersect with
   * @return The intersection if there is one, null if there is none
   */
  intersect(ray: Ray): Intersection | null {
    let intersectionMin = null;
    let intersectionTMin = Infinity;
    for (let i = 0; i < this.indices.length; i += 3) {
      const a = this.vertices[this.indices[i]];
      const b = this.vertices[this.indices[i + 1]];
      const c = this.vertices[this.indices[i + 2]];

      //create a plane from the 3 vertices of the pyramid
      const plane = new Plane(a, b, c);
      //calculate the intersection of the ray with the plane
      const intersection = plane.intersect(ray);

      const vertices = [a, b, c];
      // if the intersection is not null and is inside the triangle, return it
      if (
        intersection &&
        plane.isInside(vertices, intersection.point) &&
        intersection.t < intersectionTMin
      ) {
        intersectionMin = intersection;
        intersectionTMin = intersection.t;
      }
    }
    return intersectionMin;
  }
}
