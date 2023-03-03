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
  id: number;

  /**
   * Constructor
   * @param transform The node's transformation
   */
  //Group nodes may have an id if they are supposed to have a specific feature if they get clicked
  constructor(public transform: Transformation, id?: number) {
    super();
    this.children = new Array() as Array<Node>;
    this.id = id;
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

  toJSON() {
    return {
      GroupNode: {
        transform: this.transform.toJSON(),
        children: this.children,
      },
    };
  }
}
export class CameraNode extends Node {
  /**
   * Camera
   */
  constructor() {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitCameraNode();
  }

  toJSON() {
    return {
      CameraNode: {},
    };
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
    visitor.visitLightNode();
  }

  toJSON() {
    return {
      LightNode: {},
    };
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

  toJSON() {
    return {
      SphereNode: {
        color: this.color,
      },
    };
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
  constructor(public color: Vector, public parent?: GroupNode) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param  {Visitor} visitor - The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitAABoxNode(this);
  }
  toJSON() {
    return {
      AABoxNode: {
        color: this.color,
      },
    };
  }
}

export class PyramidNode extends Node {
  /**
   * @param color The colour of the pyramid
   */
  constructor(public color: Vector, public parent?: GroupNode) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param  {Visitor} visitor - The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitPyramidNode(this);
  }
  toJSON() {
    return {
      PyramidNode: {
        color: this.color,
      },
    };
  }
}
export class TexturePyramidNode extends Node {
  /**
   * @param color The colour of the pyramid
   */
  constructor(public texture: string, public parent?: GroupNode, public normal?: string) {
    super();
  }

    /**
   * Accepts a visitor according to the visitor pattern
   * @param  {Visitor} visitor - The visitor
   */
    accept(visitor: Visitor) {
      visitor.visitTexturePyramidNode(this);
    }
    toJSON() {
      return {
        PyramidNode: {
          texture: this.texture,
        },
      };
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
  constructor(public texture: string, public parent?: GroupNode, public normal?: string) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitTextureBoxNode(this);
  }

  toJSON() {
    return {
      TextureBoxNode: {
        texture: this.texture,
        normal: this.normal,
      },
    };
  }
}
export class TextureVideoBoxNode extends Node {
  constructor(public texture: string, public parent?: GroupNode, public normal?: string) {
    super();
  }
  accept(visitor: Visitor) {
    visitor.visitTextureVideoBoxNode(this);
  }
  toJSON() {
    return {
      TextureVideoBoxNode: {
        texture: this.texture,
        normal: this.normal,
      },
    };
  }
}

export class TextureTextBoxNode extends Node {
  constructor(public texture: string, public parent?: GroupNode, public id?: number, public normal?: string) {
    super();
  }
  accept(visitor: Visitor): void {
    visitor.visitTextureTextBoxNode(this);
  }
  toJSON() {
    return {
      TextureTextBoxNode: {
        texture: this.texture,
        normal: this.normal,
      },
    };
  }
}

export class CustomShapeNode extends Node {
  constructor(public vertices: Vector[], public indices: number[], public color: Vector, public parent?: GroupNode) {
    super();
  }
  accept(visitor: Visitor): void {
    visitor.visitCustomShapeNode(this);
  }
  toJson() {
    return {
      CustomShapeNode: {
        vertices: this.vertices,
        indices: this.indices,
        color: this.color,
      },
    };
  }
}
