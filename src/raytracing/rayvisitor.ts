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
  AABoxNode,
  CameraNode,
  CustomShapeNode,
  GroupNode,
  LightNode,
  Node,
  PyramidNode,
  SphereNode,
  TextureBoxNode,
  TextureTextBoxNode,
  TextureVideoBoxNode,
} from "../nodes";
import PhongValues, {CameraRaytracer,} from "../boilerplate/project-boilerplate";
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
export default class RayVisitor implements Visitor {
  /**
   * The image data of the context to
   * set individual pixels
   */
  imageData: ImageData;

  transformations: Matrix[];
  inverseTransformations: Matrix[];
  intersection: Intersection | null;
  intersectionColor: Vector;
  ray: Ray;
  camera: CameraRaytracer;
  lightPositions: Array<Vector>;
  phongValues: PhongValues;
  //raster objects?
  objectIntersections: [Intersection, Ray, Node][];
  x: number;
  y: number;
  /**
   * Creates a new RayVisitor
   * @param context The 2D context to render to
   * @param width The width of the canvas
   * @param height The height of the canvas
   */
  constructor(
    private context: CanvasRenderingContext2D,
    width: number,
    height: number
  ) {
    this.imageData = context.getImageData(0, 0, width, height);
  }

  /**
   * Renders the Scenegraph
   * @param rootNode The root node of the Scenegraph
   * @param camera The camera used
   * @param lightPositions The light light positions
   */
  render(
    rootNode: Node,
    camera: { origin: Vector; width: number; height: number; alpha: number },
    lightPositions: Array<Vector>,
    phongValues: PhongValues
  ) {
    // clear
    let data = this.imageData.data;
    data.fill(0);

    // raytrace
    const width = this.imageData.width;
    const height = this.imageData.height;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        this.x = x;
        this.y = y;
        this.transformations = [];
        this.inverseTransformations = [];
        this.objectIntersections = [];
        this.transformations.push(Matrix.identity());
        this.inverseTransformations.push(Matrix.identity());
        this.lightPositions = [];
        this.intersection = null;

        const toWorld = this.transformations[this.transformations.length - 1];

        rootNode.accept(this);

        // if (this.intersection) {
        //   //If the ray intersects with more than one object, sort the intersections by t-value and select the closest one
        //   if (this.objectIntersections.length > 1) {
        //     this.objectIntersections = this.objectIntersections.sort(
        //       (a, b) => a[0].t - b[0].t
        //     );
        //     if (
        //       this.objectIntersections[0][2] instanceof SphereNode ||
        //       this.objectIntersections[0][2] instanceof AABoxNode ||
        //       this.objectIntersections[0][2] instanceof PyramidNode ||
        //       this.objectIntersections[0][2] instanceof CustomShapeNode
        //     ) {
        //       this.intersectionColor = this.objectIntersections[0][2].color;
        //       this.intersection = this.objectIntersections[0][0];
        //     }
        //   }
        // }

        if (this.intersection) {
          if (!this.intersectionColor) {
            data[4 * (width * y + x) + 0] = 0;
            data[4 * (width * y + x) + 1] = 0;
            data[4 * (width * y + x) + 2] = 0;
            data[4 * (width * y + x) + 3] = 255;
          } else {
            let color = phong(this.intersectionColor, this.intersection, this.lightPositions, phongValues, this.camera.origin);
            data[4 * (width * y + x) + 0] = color.r * 255;
            data[4 * (width * y + x) + 1] = color.g * 255;
            data[4 * (width * y + x) + 2] = color.b * 255;
            data[4 * (width * y + x) + 3] = 255;
          }
        }
      }
    }
    this.context.putImageData(this.imageData, 0, 0);
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

  //All the visit functions for the different nodes are almost identical, so all can use visitNode
  visitSphereNode(node: SphereNode) {
    this.visitNode(node, UNIT_SPHERE);
  }
  visitPyramidNode(node: PyramidNode) {
    this.visitNode(node, UNIT_PYRAMID);
  }
  visitAABoxNode(node: AABoxNode) {
    this.visitNode(node, UNIT_AABOX);
  }
  visitTextureBoxNode(node: TextureBoxNode) {} //TODO
  visitTextureVideoBoxNode(node: TextureVideoBoxNode): void {} //TODO
  visitTextureTextBoxNode(node: TextureTextBoxNode): void {} //TODO
  visitCustomShapeNode(node: CustomShapeNode) {
    this.visitNode(
      node,
      new CustomShape(node.vertices, node.indices, new Vector(0, 0, 0, 1))
    );
  }

  visitNode(
    node: SphereNode | PyramidNode | AABoxNode | CustomShapeNode,
    unitObject: any
  ) {
    const toWorld = this.transformations[this.transformations.length - 1];
    const fromWorld =
      this.inverseTransformations[this.inverseTransformations.length - 1];

    const ray = new Ray(
      fromWorld.mulVec(this.ray.origin),
      fromWorld.mulVec(this.ray.direction).normalize()
    );
    let intersection = unitObject.intersect(ray);

    if (intersection) {
      this.objectIntersections.push([intersection, ray, node]);
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
  visitCameraNode(node: CameraNode) {
      let toWorld = this.transformations[this.transformations.length - 1];

      this.camera = {
        origin: toWorld.mulVec(new Vector(0, 0, 0, 1)),
        width: 100,
        height: 100,
        alpha: Math.PI / 3,
        toWorld: toWorld,
      };
      this.ray = Ray.makeRay(this.x, this.y, this.camera);
  }

  visitLightNode(node: LightNode): void {
    let toWorld = this.transformations[this.transformations.length - 1];
    this.lightPositions.push(toWorld.mulVec(new Vector(0, 0, 0, 1)));
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
  //     this.objectIntersections.push([intersection, ray, node]); //TODO: für alle anderen objekt typen
  //     const intersectionPointWorld = toWorld.mulVec(intersection.point);
  //     const intersectionNormalWorld = toWorld
  //       .mulVec(intersection.normal)
  //       .normalize();
  //     intersection = new Intersection(
  //       (intersectionPointWorld.x - ray.origin.x) / ray.direction.x,
  //       intersectionPointWorld,
  //       intersectionNormalWorld
  //     );

  //     //kann man das überhaupt erreichen?
  //     if (
  //       this.intersection === null ||
  //       intersection.closerThan(this.intersection)
  //     ) {
  //       this.intersection = intersection;
  //       this.intersectionColor = node.color;
  //     }
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
  //       this.intersectionColor = node.color;
  //     }
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
  //       this.intersectionColor = node.color;
  //     }
  //   }
  // }

  /**
   * Visits a textured box node
   * @param node The node to visit
   */
}
