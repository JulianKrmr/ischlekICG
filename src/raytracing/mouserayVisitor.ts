import Matrix from "../math/matrix";
import Vector from "../math/vector";
import Sphere from "../objects/sphere";
import AABox from "../objects/aabox";
import Pyramid from "../objects/pyramid";

import Intersection from "../math/intersection";
import Ray from "../math/ray";
import Visitor from "../visitor";
import phong from "../phong";
import {
  Node,
  GroupNode,
  SphereNode,
  AABoxNode,
  TextureBoxNode,
  PyramidNode,
} from "src/nodes";
import { ChildProcess } from "child_process";
import PhongValues from "../boilerplate/project-boilerplate";

const UNIT_SPHERE = new Sphere(
  new Vector(0, 0, 0, 1),
  1,
  new Vector(0, 0, 0, 1)
);
const UNIT_AABOX = new AABox(
  new Vector(-0.5, -0.5, -0.5, 1),
  new Vector(0.5, 0.5, 0.5, 1),
  new Vector(0, 0, 0, 1)
);
const UNIT_PYRAMID = new Pyramid(
  new Vector(0, 1, 0, 1),
  new Vector(0, 0, -0.5, 1),
  new Vector(-1, 0, 0.5, 1),
  new Vector(1, 0, 0.5, 1),
  new Vector(0, 0, 0, 1)
);

/**
 * Class representing a Visitor that uses
 * Raytracing to render a Scenegraph
 */
export default class RayVisitor implements Visitor {
  /**
   * The image data of the context to
   * set individual pixels
   */

  transformations: Matrix[];
  inverseTransformations: Matrix[];
  intersection: Intersection | null;
  intersectionColor: Vector;
  ray: Ray;
  phongValues: PhongValues; //evtl raus? falls nicht wieder in constructor rein
  /**
   * Creates a new RayVisitor
   * @param context The 2D context to render to
   * @param width The width of the canvas
   * @param height The height of the canvas
   */
  constructor(width: number, height: number) {
    // this.imageData = context.getImageData(0, 0, width, height);
  }

  /**
   * Renders the Scenegraph
   * @param rootNode The root node of the Scenegraph
   * @param camera The camera used
   * @param lightPositions The light light positions
   */
  click(
    rootNode: Node,
    camera: { origin: Vector; width: number; height: number; alpha: number },
    x: number,
    y: number,
    renderingContext: any
  ) {
    // raytrace
    const width = renderingContext.canvas.width;
    const height = renderingContext.canvas.height;

    y = y / 20;
    x = x / 20;

    console.log(x + " " + y);

    this.ray = Ray.makeRay(x, y, camera);
    this.transformations = [Matrix.identity()];
    this.inverseTransformations = [Matrix.identity()];

    this.intersection = null;
    rootNode.accept(this);

    if (this.intersection) {
      console.log("Intersection");
      console.log(this.intersection);
    }
  }

  /**
   * Visits a group node
   * @param node The node to visit
   */
  visitGroupNode(node: GroupNode) {
    this.transformations.push(
      this.transformations[this.transformations.length - 1].mul(
        node.transform.getMatrix()
      )
    );
    this.inverseTransformations.push(
      node.transform
        .getInverseMatrix()
        .mul(
          this.inverseTransformations[this.inverseTransformations.length - 1]
        )
    );

    for (let i = 0; i < node.children.length; i++) {
      node.children[i].accept(this);
    }
    this.transformations.pop();
    this.inverseTransformations.pop();
  }

  /**
   * Visits a sphere node
   * @param node - The node to visit
   */
  visitSphereNode(node: SphereNode) {
    const toWorld = this.transformations[this.transformations.length - 1];
    const fromWorld =
      this.inverseTransformations[this.inverseTransformations.length - 1];

    const ray = new Ray(
      fromWorld.mulVec(this.ray.origin),
      fromWorld.mulVec(this.ray.direction).normalize()
    );
    let intersection = UNIT_SPHERE.intersect(ray);

    if (intersection) {
      //nur zum testen
      node.color = new Vector(Math.random(), Math.random(), Math.random(), 1);

      const intersectionPointWorld = toWorld.mulVec(intersection.point);
      const intersectionNormalWorld = toWorld
        .mulVec(intersection.normal)
        .normalize();
      intersection = new Intersection(
        (intersectionPointWorld.x - ray.origin.x) / ray.direction.x,
        intersectionPointWorld,
        intersectionNormalWorld
      );
      if (
        this.intersection === null ||
        intersection.closerThan(this.intersection)
      ) {
        this.intersection = intersection;
        this.intersectionColor = node.color;
      }
    }
  }

  /**
   * Visits an axis aligned box node
   * @param node The node to visit
   */
  visitAABoxNode(node: AABoxNode) {
    const toWorld = this.transformations[this.transformations.length - 1];
    const fromWorld =
      this.inverseTransformations[this.inverseTransformations.length - 1];

    const ray = new Ray(
      fromWorld.mulVec(this.ray.origin),
      fromWorld.mulVec(this.ray.direction).normalize()
    );
    let intersection = UNIT_AABOX.intersect(ray);

    if (intersection) {
      const intersectionPointWorld = toWorld.mulVec(intersection.point);
      const intersectionNormalWorld = toWorld
        .mulVec(intersection.normal)
        .normalize();
      intersection = new Intersection(
        (intersectionPointWorld.x - ray.origin.x) / ray.direction.x,
        intersectionPointWorld,
        intersectionNormalWorld
      );
      if (
        this.intersection === null ||
        intersection.closerThan(this.intersection)
      ) {
        this.intersection = intersection;
        this.intersectionColor = node.color;
      }
    }
  }

  /**
   * Visits an axis aligned box node
   * @param node The node to visit
   */
  visitPyramidNode(node: PyramidNode) {
    const toWorld = this.transformations[this.transformations.length - 1];
    const fromWorld =
      this.inverseTransformations[this.inverseTransformations.length - 1];

    const ray = new Ray(
      fromWorld.mulVec(this.ray.origin),
      fromWorld.mulVec(this.ray.direction).normalize()
    );
    let intersection = UNIT_PYRAMID.intersect(ray);

    if (intersection) {
      const intersectionPointWorld = toWorld.mulVec(intersection.point);
      const intersectionNormalWorld = toWorld
        .mulVec(intersection.normal)
        .normalize();
      intersection = new Intersection(
        (intersectionPointWorld.x - ray.origin.x) / ray.direction.x,
        intersectionPointWorld,
        intersectionNormalWorld
      );
      if (
        this.intersection === null ||
        intersection.closerThan(this.intersection)
      ) {
        this.intersection = intersection;
        this.intersectionColor = node.color;
      }
    }
  }

  /**
   * Visits a textured box node
   * @param node The node to visit
   */
  visitTextureBoxNode(node: TextureBoxNode) {}
}

//TODO code cleanen
