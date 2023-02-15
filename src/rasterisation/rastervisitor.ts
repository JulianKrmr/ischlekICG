import RasterSphere from "./raster-sphere";
import RasterBox from "./raster-box";
import RasterTextureBox from "./raster-texture-box";
import Vector from "../math/vector";
import Matrix from "../math/matrix";
import Visitor from "src/visitor";
import {
  Node,
  GroupNode,
  SphereNode,
  AABoxNode,
  TextureBoxNode,
  PyramidNode,
} from "../nodes";
import Shader from "../shader/shader";
import RasterPyramid from "./rasterpyramid";
import Ray from "../math/ray";
import Intersection from "../math/intersection";
import PhongValues from "../boilerplate/project-boilerplate";
import AABox from "../objects/aabox";
import Sphere from "../objects/sphere";

const UNIT_AABOX = new AABox(
  new Vector(-0.5, -0.5, -0.5, 1),
  new Vector(0.5, 0.5, 0.5, 1),
  new Vector(0, 0, 0, 1)
);

const UNIT_SPHERE = new Sphere(
  new Vector(0, 0, 0, 1),
  1,
  new Vector(0, 0, 0, 1)
);

interface Camera {
  eye: Vector;
  center: Vector;
  up: Vector;
  fovy: number;
  aspect: number;
  near: number;
  far: number;
}

interface Renderable {
  render(shader: Shader): void;
}

/**
 * Class representing a Visitor that uses Rasterisation
 * to render a Scenegraph
 */
export class RasterVisitor implements Visitor {
  transformations: Matrix[];
  inverseTransformations: Matrix[];

  mouseRay: Ray;

  //raster objects?
  objectIntersections: [Intersection, Ray, Node][];

  /**
   * Creates a new RasterVisitor
   * @param gl The 3D context to render to
   * @param shader The default shader to use
   * @param textureshader The texture shader to use
   */
  constructor(
    private gl: WebGL2RenderingContext,
    private shader: Shader,
    private textureshader: Shader,
    private renderables: WeakMap<Node, Renderable>
  ) {
    this.transformations = [Matrix.identity()];
    this.inverseTransformations = [Matrix.identity()];
  }

  /**
   * Renders the Scenegraph
   * @param rootNode The root node of the Scenegraph
   * @param camera The camera used
   * @param lightPositions The light light positions
   */
  render(rootNode: Node, camera: Camera | null, lightPositions: Array<Vector>) {
    // clear
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    if (camera) {
      this.setupCamera(camera);
    }

    // traverse and render
    rootNode.accept(this);

    //////// TODO ///////////
    // intersections sortieren
    // mouse ray auf null setzen
    // effekt was passiert wenn man geklickt wurde
  }
  renderWithPhong(
    rootNode: Node,
    camera: Camera | null,
    lightPositions: Array<Vector>,
    phongValues: PhongValues
  ) {
    // clear
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    if (camera) {
      this.setupCamera(camera);
    }
    this.passPhongValues(phongValues);

    // traverse and render
    rootNode.accept(this);
  }

  passPhongValues(phongValues: PhongValues) {
    const shader = this.shader;
    shader.use();

    shader.getUniformFloat("shininess").set(phongValues.shininess);
    shader.getUniformFloat("kA").set(phongValues.ambient);
    shader.getUniformFloat("kD").set(phongValues.diffuse);
    shader.getUniformFloat("kS").set(phongValues.specular);

    const textureShader = this.textureshader;
    textureShader.use();

    textureShader.getUniformFloat("shininess").set(phongValues.shininess);
    textureShader.getUniformFloat("kA").set(phongValues.ambient);
    textureShader.getUniformFloat("kD").set(phongValues.diffuse);
    textureShader.getUniformFloat("kS").set(phongValues.specular);
  }

  /**
   * The view matrix to transform vertices from
   * the world coordinate system to the
   * view coordinate system
   */
  private lookat: Matrix;

  /**
   * The perspective matrix to transform vertices from
   * the view coordinate system to the
   * normalized device coordinate system
   */
  private perspective: Matrix;

  /**
   * Helper function to setup camera matrices
   * @param camera The camera used
   */
  setupCamera(camera: Camera) {
    this.lookat = Matrix.lookat(camera.eye, camera.center, camera.up);

    this.perspective = Matrix.perspective(
      camera.fovy,
      camera.aspect,
      camera.near,
      camera.far
    );
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
   * @param node The node to visit
   */
  visitSphereNode(node: SphereNode) {
    let rasterSphere = this.renderables.get(node) as RasterSphere;

    const shader = this.shader;
    shader.use();
    const toWorld = this.transformations[this.transformations.length - 1];
    const fromWorld =
      this.inverseTransformations[this.inverseTransformations.length - 1];

    shader.getUniformMatrix("M").set(toWorld);
    shader.getUniformMatrix("M_inverse").set(fromWorld);

    const V = shader.getUniformMatrix("V");
    if (V && this.lookat) {
      V.set(this.lookat);
    }
    const P = shader.getUniformMatrix("P");
    if (P && this.perspective) {
      P.set(this.perspective);
    }

    const N = shader.getUniformMatrix("N");
    if (N) {
      N.set(fromWorld.transpose());
    }

    //was macht das?
    const normalMatrix = fromWorld.transpose();
    normalMatrix.setVal(0, 3, 0);
    normalMatrix.setVal(1, 3, 0);
    normalMatrix.setVal(2, 3, 0);
    normalMatrix.setVal(3, 3, 1);
    normalMatrix.setVal(3, 0, 0);
    normalMatrix.setVal(3, 1, 0);
    normalMatrix.setVal(3, 2, 0);
    if (normalMatrix && fromWorld) {
      shader.getUniformMatrix("N").set(normalMatrix);
    }

    if (this.mouseRay) {
      let rasterSphere = this.renderables.get(node) as RasterSphere;

      const toWorld = this.transformations[this.transformations.length - 1];
      const fromWorld =
        this.inverseTransformations[this.inverseTransformations.length - 1];

      const ray = new Ray(
        fromWorld.mulVec(this.mouseRay.origin),
        fromWorld.mulVec(this.mouseRay.direction).normalize()
      );
      let intersection = UNIT_SPHERE.intersect(ray);
      // let intersection = rasterSphere.intersect(ray);

      if (intersection) {
        console.log("intersection");
        console.log(intersection);
        console.log(this.mouseRay);
        this.mouseRay = null;
      }
    }
    this.renderables.get(node).render(shader);
  }

  /**
   * Visits an axis aligned box node
   * @param  {AABoxNode} node - The node to visit
   */
  visitAABoxNode(node: AABoxNode) {
    this.shader.use();
    let shader = this.shader;
    const toWorld = this.transformations[this.transformations.length - 1];
    shader.getUniformMatrix("M").set(toWorld);
    let V = shader.getUniformMatrix("V");
    if (V && this.lookat) {
      V.set(this.lookat);
    }
    let P = shader.getUniformMatrix("P");
    if (P && this.perspective) {
      P.set(this.perspective);
    }

    this.renderables.get(node).render(shader);
    if (this.mouseRay) {
      let rasterBox = this.renderables.get(node) as RasterBox;
      // const intersection = rasterBox.intersect(this.mouseRay);

      const toWorld = this.transformations[this.transformations.length - 1];
      const fromWorld =
        this.inverseTransformations[this.inverseTransformations.length - 1];

      const ray = new Ray(
        fromWorld.mulVec(this.mouseRay.origin),
        fromWorld.mulVec(this.mouseRay.direction).normalize()
      );
      // let intersection = UNIT_AABOX.intersect(ray);
      let intersection = rasterBox.intersect(ray);

      if (intersection) {
        console.log("intersection");
        console.log(intersection);
        console.log(this.mouseRay);
        this.mouseRay = null;
      }
    }
  }

  /**
   * Visits a Pyramid node
   * @param  {PyramidNode} node - The node to visit
   */
  visitPyramidNode(node: PyramidNode) {
    this.shader.use();
    let shader = this.shader;
    const toWorld = this.transformations[this.transformations.length - 1];
    shader.getUniformMatrix("M").set(toWorld);
    let V = shader.getUniformMatrix("V");
    if (V && this.lookat) {
      V.set(this.lookat);
    }
    let P = shader.getUniformMatrix("P");
    if (P && this.perspective) {
      P.set(this.perspective);
    }

    this.renderables.get(node).render(shader);

    if (this.mouseRay) {
      let rasterPyramid = this.renderables.get(node) as RasterPyramid;
      const intersection = rasterPyramid.intersect(this.mouseRay);
      if (intersection) {
        console.log("intersection");
        console.log(intersection);
        console.log(this.mouseRay);
        this.mouseRay = null;
      }
    }
  }

  /**
   * Visits a textured box node
   * @param  {TextureBoxNode} node - The node to visit
   */
  visitTextureBoxNode(node: TextureBoxNode) {
    this.textureshader.use();
    let shader = this.textureshader;

    const toWorld = this.transformations[this.transformations.length - 1];
    shader.getUniformMatrix("M").set(toWorld);
    let P = shader.getUniformMatrix("P");
    if (P && this.perspective) {
      P.set(this.perspective);
    }
    shader.getUniformMatrix("V").set(this.lookat);

    this.renderables.get(node).render(shader);
  }

  //TODO: Testen
  castRayFromMouse(x: number, y: number) {
    //Kamera ist wahrscheinlich in falschen koordinaten angegeben
    let camera = {
      width: this.gl.canvas.width,
      height: this.gl.canvas.height,
      alpha: Math.PI / 3,
    };
    this.mouseRay = Ray.makeRay(x, y, camera);
  }
}

/**
 * Class representing a Visitor that sets up buffers
 * for use by the RasterVisitor
 * */
export class RasterSetupVisitor {
  /**
   * The created render objects
   */
  public objects: WeakMap<Node, Renderable>;

  /**
   * Creates a new RasterSetupVisitor
   * @param context The 3D context in which to create buffers
   */
  constructor(private gl: WebGL2RenderingContext) {
    this.objects = new WeakMap();
  }

  /**
   * Sets up all needed buffers
   * @param rootNode The root node of the Scenegraph
   */
  setup(rootNode: Node) {
    // Clear to white, fully opaque
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    // Clear everything
    this.gl.clearDepth(1.0);
    // Enable depth testing
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);

    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);

    rootNode.accept(this);
  }

  /**
   * Visits a group node
   * @param node The node to visit
   */
  visitGroupNode(node: GroupNode) {
    for (let child of node.children) {
      child.accept(this);
    }
  }

  /**
   * Visits a sphere node
   * @param node - The node to visit
   */
  visitSphereNode(node: SphereNode) {
    this.objects.set(
      node,
      new RasterSphere(this.gl, new Vector(0, 0, 0, 1), 1, node.color)
    );
  }

  /**
   * Visits an axis aligned box node
   * @param  {AABoxNode} node - The node to visit
   */
  visitAABoxNode(node: AABoxNode) {
    this.objects.set(
      node,
      new RasterBox(
        this.gl,
        new Vector(-0.5, -0.5, -0.5, 1),
        new Vector(0.5, 0.5, 0.5, 1),
        node.color
      )
    );
  }

  visitPyramidNode(node: PyramidNode) {
    this.objects.set(
      node,
      new RasterPyramid(
        this.gl,
        node.color,
        new Vector(0, 1, 0, 1),
        new Vector(0, 0, -0.5, 1),
        new Vector(-1, 0, 0.5, 1),
        new Vector(1, 0, 0.5, 1)
      )
    );
  }

  /**
   * Visits a textured box node. Loads the texture
   * and creates a uv coordinate buffer
   * @param  {TextureBoxNode} node - The node to visit
   */
  visitTextureBoxNode(node: TextureBoxNode) {
    this.objects.set(
      node,
      new RasterTextureBox(
        this.gl,
        new Vector(-0.5, -0.5, -0.5, 1),
        new Vector(0.5, 0.5, 0.5, 1),
        node.texture
      )
    );
  }
}
