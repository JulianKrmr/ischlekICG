import Visitor from "visitor";
import Vector from "./math/vector";
import { Transformation } from "src/math/transformation";

/**
 * Class representing a Node in a Scenegraph
 */
export class Node {
  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor - The visitor
   */
  accept(visitor: Visitor) {}
}

/**
 * Class representing a GroupNode in the Scenegraph.
 * A GroupNode holds a transformation and is able
 * to have child nodes attached to it.
 * @extends Node
 */
export class GroupNode extends Node {
  children: Node[];

  /**
   * Constructor
   * @param transform The node's transformation
   */
  constructor(public transform: Transformation) {
    super();
    this.children = new Array() as Array<Node>;
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitGroupNode(this);
  }

  /**
   * Adds a child node
   * @param childNode The child node to add
   */
  add(childNode: Node) {
    this.children.push(childNode);
  }
}
export class CameraNode extends Node {
  /**
   * Camera
   */
  constructor(public active: boolean) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitCameraNode(this, this.active);
  }

  setActiveStatus(val: boolean) {
    this.active = val;
  }
}

export class LightNode extends Node {

  /**
   * Lichtquelle / Light
   */
  constructor() {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitLightNode(this);
  }

  toJSON() {
    return {
      "LightNode": {}
    }
  }
}

/**
 * Class representing a Sphere in the Scenegraph
 * @extends Node
 */
export class SphereNode extends Node {
  /**
   * Creates a new Sphere.
   * The sphere is defined around the origin
   * with radius 1.
   * @param color The colour of the Sphere
   */
  constructor(public color: Vector, public parent?: GroupNode) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitSphereNode(this);
  }
}

/**
 * Class representing an Axis Aligned Box in the Scenegraph
 * @extends Node
 */
export class AABoxNode extends Node {
  /**
   * Creates an axis aligned box.
   * The box's center is located at the origin
   * with all edges of length 1
   * @param color The colour of the cube
   */
  constructor(
    public color: Vector,
    public color2: Vector,
    public parent?: GroupNode
  ) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param  {Visitor} visitor - The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitAABoxNode(this);
  }
}

export class PyramidNode extends Node {
  /**
   * @param color The colour of the pyramid
   */
  constructor(
    public area: Vector,
    public color?: Vector,
    public color2?: Vector,
    public parent?: GroupNode
  ) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param  {Visitor} visitor - The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitPyramidNode(this);
  }
}

/**
 * Class representing a Textured Axis Aligned Box in the Scenegraph
 * @extends Node
 */
export class TextureBoxNode extends Node {
  /**
   * Creates an axis aligned box textured box
   * The box's center is located at the origin
   * with all edges of length 1
   * @param texture The image filename for the texture
   */
  constructor(
    public texture: string,
    public parent?: GroupNode,
    public normal?: string
  ) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitTextureBoxNode(this);
  }
}

export class CustomShapeNode extends Node {
  constructor(
    public vertices: Vector[],
    public indices: number[],
    public color: Vector,
    public parent?: GroupNode
  ) {
    super();
  }
  accept(visitor: Visitor): void {
    visitor.visitCustomShapeNode(this);
  }
}
