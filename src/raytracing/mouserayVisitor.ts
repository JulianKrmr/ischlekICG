import Matrix from "../math/matrix";
import Vector from "../math/vector";
import Sphere from "../objects/sphere";
import AABox from "../objects/aabox";
import Pyramid from "../objects/pyramid";

import Intersection from "../math/intersection";
import Ray from "../math/ray";
import Visitor from "../visitor";
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
import PhongValues, { CameraRasteriser, CameraRaytracer } from "../boilerplate/project-boilerplate";
import CustomShape from "../objects/customShape";

const UNIT_SPHERE = new Sphere(new Vector(0, 0, 0, 1), 1, new Vector(0, 0, 0, 1));
const UNIT_AABOX = new AABox(new Vector(-0.5, -0.5, -0.5, 1), new Vector(0.5, 0.5, 0.5, 1), new Vector(0, 0, 0, 1));
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
  phongValues: PhongValues;
  camera: CameraRaytracer | CameraRasteriser;
  x: number;
  y: number;
  width: number;
  height: number;
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
  //Is triggered by mouseclick, casts a ray (like in rayvisitor) and returns the closest objectNode
  click(rootNode: Node, camera: { origin: Vector; width: number; height: number; alpha: number }, x: number, y: number, renderingContext: any) {
    this.transformations = [];
    this.inverseTransformations = [];
    this.objectIntersections = [];
    this.transformations.push(Matrix.identity());
    this.inverseTransformations.push(Matrix.identity());
    this.intersection = null;

    if (renderingContext == WebGL2RenderingContext) {
      //rasterizer

      this.width = 500;
      this.height = 500;
    } else {
      //raytracer
      this.y = y / 10;
      this.x = x / 10;
      this.width = 100;
      this.height = 100;
    }

    this.transformations = [Matrix.identity()];
    this.inverseTransformations = [Matrix.identity()];
    this.objectIntersections = [];

    this.intersection = null;
    rootNode.accept(this);

    if (this.intersection) {
      //sorts the intersections by t value in ascending order and selects the closest one
      this.objectIntersections = this.objectIntersections.sort((a, b) => a[0].t - b[0].t);
      let intersectedNode = this.objectIntersections[0][2];
      if (
        intersectedNode instanceof SphereNode ||
        intersectedNode instanceof AABoxNode ||
        intersectedNode instanceof PyramidNode ||
        intersectedNode instanceof CustomShapeNode ||
        intersectedNode instanceof TextureBoxNode ||
        intersectedNode instanceof TextureVideoBoxNode ||
        intersectedNode instanceof TextureTextBoxNode
      ) {
        //Selects the node of the closest intersection and returns it
        return intersectedNode;
      }
    }
  }

  CameraDrive(rootNode: Node, camera: { origin: Vector; width: number; height: number; alpha: number }, x: number, y: number, renderingContext: any) {
    this.transformations = [];
    this.inverseTransformations = [];
    this.objectIntersections = [];
    this.transformations.push(Matrix.identity());
    this.inverseTransformations.push(Matrix.identity());
    this.intersection = null;

    if (renderingContext == WebGL2RenderingContext) {
      //rasterizer
      this.width = 500;
      this.height = 500;
    } else {
      //raytracer
      this.y = y / 10;
      this.x = x / 10;
      this.width = 100;
      this.height = 100;
    }

    this.transformations = [Matrix.identity()];
    this.inverseTransformations = [Matrix.identity()];
    this.objectIntersections = [];

    this.intersection = null;
    rootNode.accept(this);

    if (this.intersection) {
      return this.ray;
    }
  }

  /**
   * Visits a group node
   * @param node The node to visit
   */
  visitGroupNode(node: GroupNode) {
    this.transformations.push(this.transformations[this.transformations.length - 1].mul(node.transform.getMatrix()));
    this.inverseTransformations.push(node.transform.getInverseMatrix().mul(this.inverseTransformations[this.inverseTransformations.length - 1]));

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
  visitTextureBoxNode(node: TextureBoxNode) {
    this.visitNode(node, UNIT_AABOX);
  }
  visitTextureVideoBoxNode(node: TextureVideoBoxNode): void {
    this.visitNode(node, UNIT_AABOX);
  }
  visitTextureTextBoxNode(node: TextureTextBoxNode): void {
    this.visitNode(node, UNIT_AABOX);
  }
  visitCustomShapeNode(node: CustomShapeNode): void {
    this.visitNode(node, new CustomShape(node.vertices, node.indices, new Vector(0, 0, 0, 1)));
  }
  visitCameraNode(node: CameraNode) {
    let toWorld = this.transformations[this.transformations.length - 1];
    const origin = toWorld.mulVec(new Vector(0, 0, 0, 1));
    this.ray = Ray.makeRay(this.x, this.y, { width: this.width, height: this.height, alpha: Math.PI / 3, origin: origin });
    console.log(this.ray);
  }

  visitLightNode(node: LightNode) {}

  //visits a node and checks for intersection, pushes intersection and node to array
  visitNode(node: Node, unitObject: any) {
    const toWorld = this.transformations[this.transformations.length - 1];
    const fromWorld = this.inverseTransformations[this.inverseTransformations.length - 1];

    const ray = new Ray(fromWorld.mulVec(this.ray.origin), fromWorld.mulVec(this.ray.direction).normalize());
    let intersection = unitObject.intersect(ray);

    if (intersection) {
      const intersectionPointWorld = toWorld.mulVec(intersection.point);
      const intersectionNormalWorld = toWorld.mulVec(intersection.normal).normalize();
      intersection = new Intersection((intersectionPointWorld.x - ray.origin.x) / ray.direction.x, intersectionPointWorld, intersectionNormalWorld);
      if (this.intersection === null || intersection.closerThan(this.intersection)) {
        this.intersection = intersection;
      }
      this.objectIntersections.push([intersection, ray, node]);
    }
  }
}
