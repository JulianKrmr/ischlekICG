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
  CustomShapeNode,
  CameraNode,
  LightNode,
} from "../nodes";
import { ChildProcess } from "child_process";
import PhongValues, {
  CameraRasteriser,
  CameraRaytracer,
} from "../boilerplate/project-boilerplate";
import CustomShape from "../objects/customShape";

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
  new Vector(-0.5, 0, -0.5, 1),
  new Vector(-0.5, 0, 0.5, 1),
  new Vector(0.5, 0, -0.5, 1),
  new Vector(0.5, 0, 0.5, 1),
  new Vector(0, 1, 0, 1),
  new Vector(0, 0, 0, 1)
);

/**
 * Class representing a Visitor that uses
 * Raytracing to render a Scenegraph
 */
export default class MouserayVisitor implements Visitor {
  /**
   * The image data of the context to
   * set individual pixels
   */

  transformations: Matrix[];
  inverseTransformations: Matrix[];
  intersection: Intersection | null;
  ray: Ray;
  objectIntersections: [Intersection, Ray, Node][];
  phongValues: PhongValues; //evtl raus? falls nicht wieder in constructor rein
  camera: CameraRaytracer | CameraRasteriser;
  /**
   * Creates a new RayVisitor
   * @param context The 2D context to render to
   * @param width The width of the canvas
   * @param height The height of the canvas
   */

  //May be used to scale to canvas size, currently useless
  constructor(width: number, height: number) {}

  /**
   * Renders the Scenegraph
   * @param rootNode The root node of the Scenegraph
   * @param camera The camera used
   * @param lightPositions The light light positions
   */
  //Is triggered by mouseclick, casts a ray (like in rayvisitor) and selects the closest object
  click(
    rootNode: Node,
    camera: { origin: Vector; width: number; height: number; alpha: number },
    x: number,
    y: number,
    renderingContext: any //bisher useless
  ) {
    this.transformations = [];
    this.inverseTransformations = [];
    this.objectIntersections = [];
    this.transformations.push(Matrix.identity());
    this.inverseTransformations.push(Matrix.identity());
    this.intersection = null;
    let toWorld = this.transformations[this.transformations.length - 1];

    if (renderingContext == WebGL2RenderingContext) {
      //rasterizer
      y = y / 2;
      x = x / 2;
      let cameraRasteriser = {
        eye: new Vector(0, 0, 0, 1),
        center: new Vector(0, 0, -1, 1),
        up: new Vector(0, 1, 0, 0),
        fovy: 60,
        aspect: 500 / 500,
        near: 0.1,
        far: 100,
      };
      this.camera = cameraRasteriser;
      this.ray = Ray.makeRay(x, y, { width: 500, height: 500, alpha: 60 });
    } else {
      //raytracer
      y = y / 10;
      x = x / 10;
      let cameraRaytracer = {
        origin: toWorld.mulVec(new Vector(0, 0, 0, 1)),
        width: 100,
        height: 100,
        alpha: Math.PI / 3,
        toWorld: toWorld,
      };
      this.camera = cameraRaytracer;
      this.ray = Ray.makeRay(x, y, { width: 100, height: 100, alpha: 60 });
    }

    console.log(this.ray);
    //so far useless, may be used to scale to canvas size
    const width = renderingContext.canvas.width;
    const height = renderingContext.canvas.height;

    //To scale to canvas size, has to be changed if canvas size changes

    this.transformations = [Matrix.identity()];
    this.inverseTransformations = [Matrix.identity()];
    this.objectIntersections = [];

    this.intersection = null;
    rootNode.accept(this);

    if (this.intersection) {
      //sorts the intersections by t value in ascending order and selects the closest one
      this.objectIntersections = this.objectIntersections.sort(
        (a, b) => a[0].t - b[0].t
      );
      if (
        this.objectIntersections[0][2] instanceof SphereNode ||
        this.objectIntersections[0][2] instanceof AABoxNode ||
        this.objectIntersections[0][2] instanceof PyramidNode ||
        this.objectIntersections[0][2] instanceof CustomShapeNode
      ) {
        //das gibt total schwachsinnige werte für t
        // console.log(this.objectIntersections[0][0].t);
        // console.log(this.objectIntersections[1][0].t);

        //Selects the node of the closest intersection
        this.objectIntersections[0][2].color = new Vector(
          Math.random(),
          Math.random(),
          Math.random(),
          0
        );
        return this.objectIntersections[0][2];
      }
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

  visitSphereNode(node: SphereNode): void {
    this.visitNode(node, UNIT_SPHERE);
  }
  visitPyramidNode(node: PyramidNode): void {
    this.visitNode(node, UNIT_PYRAMID);
  }
  visitAABoxNode(node: AABoxNode): void {
    this.visitNode(node, UNIT_AABOX);
  }
  visitTextureBoxNode(node: TextureBoxNode) {}
  visitCustomShapeNode(node: CustomShapeNode): void {
    this.visitNode(
      node,
      new CustomShape(node.vertices, node.indices, new Vector(0, 0, 0, 1))
    );
  }
  visitCameraNode(node: CameraNode) {}

  visitLightNode(node: LightNode) {}

  //interface ray object statt any?
  //visits a node and checks for intersection, pushes intersection and node to array
  visitNode(node: Node, unitObject: any) {
    const toWorld = this.transformations[this.transformations.length - 1];
    const fromWorld =
      this.inverseTransformations[this.inverseTransformations.length - 1];

    const ray = new Ray(
      fromWorld.mulVec(this.ray.origin),
      fromWorld.mulVec(this.ray.direction).normalize()
    );
    let intersection = unitObject.intersect(ray);

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
      }
      this.objectIntersections.push([intersection, ray, node]);
    }
  }
}

/**
 * Visits a sphere node
 * @param node - The node to visit
 */
// visitSphereNode(node: SphereNode) {
//   const toWorld = this.transformations[this.transformations.length - 1];
//   const fromWorld =
//     this.inverseTransformations[this.inverseTransformations.length - 1];

//   const ray = new Ray(
//     fromWorld.mulVec(this.ray.origin),
//     fromWorld.mulVec(this.ray.direction).normalize()
//   );
//   let intersection = UNIT_SPHERE.intersect(ray);

//   if (intersection) {
//     const intersectionPointWorld = toWorld.mulVec(intersection.point);
//     const intersectionNormalWorld = toWorld
//       .mulVec(intersection.normal)
//       .normalize();
//     intersection = new Intersection(
//       (intersectionPointWorld.x - ray.origin.x) / ray.direction.x,
//       intersectionPointWorld,
//       intersectionNormalWorld
//     );
//     if (
//       this.intersection === null ||
//       intersection.closerThan(this.intersection)
//     ) {
//       this.intersection = intersection;
//     }
//     this.objectIntersections.push([intersection, ray, node]);
//   }
// }

// /**
//  * Visits an axis aligned box node
//  * @param node The node to visit
//  */
// visitAABoxNode(node: AABoxNode) {
//   const toWorld = this.transformations[this.transformations.length - 1];
//   const fromWorld =
//     this.inverseTransformations[this.inverseTransformations.length - 1];

//   const ray = new Ray(
//     fromWorld.mulVec(this.ray.origin),
//     fromWorld.mulVec(this.ray.direction).normalize()
//   );
//   let intersection = UNIT_AABOX.intersect(ray);

//   if (intersection) {
//     const intersectionPointWorld = toWorld.mulVec(intersection.point);
//     const intersectionNormalWorld = toWorld
//       .mulVec(intersection.normal)
//       .normalize();
//     intersection = new Intersection(
//       (intersectionPointWorld.x - ray.origin.x) / ray.direction.x,
//       intersectionPointWorld,
//       intersectionNormalWorld
//     );
//     if (
//       this.intersection === null ||
//       intersection.closerThan(this.intersection)
//     ) {
//       this.intersection = intersection;
//     }
//     this.objectIntersections.push([intersection, ray, node]);
//   }
// }

// /**
//  * Visits an axis aligned box node
//  * @param node The node to visit
//  */
// visitPyramidNode(node: PyramidNode) {
//   const toWorld = this.transformations[this.transformations.length - 1];
//   const fromWorld =
//     this.inverseTransformations[this.inverseTransformations.length - 1];

//   const ray = new Ray(
//     fromWorld.mulVec(this.ray.origin),
//     fromWorld.mulVec(this.ray.direction).normalize()
//   );
//   let intersection = UNIT_PYRAMID.intersect(ray);

//   if (intersection) {
//     const intersectionPointWorld = toWorld.mulVec(intersection.point);
//     const intersectionNormalWorld = toWorld
//       .mulVec(intersection.normal)
//       .normalize();
//     intersection = new Intersection(
//       (intersectionPointWorld.x - ray.origin.x) / ray.direction.x,
//       intersectionPointWorld,
//       intersectionNormalWorld
//     );
//     if (
//       this.intersection === null ||
//       intersection.closerThan(this.intersection)
//     ) {
//       this.intersection = intersection;
//     }
//     this.objectIntersections.push([intersection, ray, node]);
//   }
// }

/**
 * Visits a textured box node
 * @param node The node to visit
 */
