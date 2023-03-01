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
  CustomShapeNode,
  CameraNode,
  LightNode,
  TextureVideoBoxNode,
  TextureTextBoxNode,
} from "../nodes";
import Shader from "../shader/shader";
import RasterPyramid from "./rasterpyramid";
import Ray from "../math/ray";
import Intersection from "../math/intersection";
import PhongValues from "../boilerplate/project-boilerplate";
import AABox from "../objects/aabox";
import Sphere from "../objects/sphere";
import RasterVideoTextureBox from "./raster-texture-box-video";
import RasterTextTextureBox from "./raster-texture-box-text";

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
  eye: Vector;
  lightPositions: Array<Vector>;
  cameraToWorld: Matrix;

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

    // traverse and render
    rootNode.accept(this);
  }
  renderWithPhong(
    rootNode: Node,
    camera: Camera | null,
    lightPositions: Array<Vector>,
    phongValues: PhongValues
  ) {
    // clear
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // if (camera) {
    //   this.setupCamera(camera);
    // }
    this.transformations = [];
    this.inverseTransformations = [];
    this.transformations.push(Matrix.identity());
    this.inverseTransformations.push(Matrix.identity());
    this.lightPositions = [];
    rootNode.accept(this);
    this.passCameraPosition(this.eye);
    this.passLightPositions(this.lightPositions);
    this.passPhongValues(phongValues);

    // traverse and render
    rootNode.accept(this);
  }

  private passCameraPosition(eye: Vector) {
    const shader = this.shader;
    shader.use();
    shader.getUniformVec3("cameraPos").set(eye);

    const textureShader = this.textureshader;
    textureShader.use();
    textureShader.getUniformVec3("cameraPos").set(eye);
  }

  passLightPositions(lightPositions: Array<Vector>) {
    const shader = this.shader;
    shader.use();
    const L = shader.getUniformVec3Array("LightPositions");
    L.set(lightPositions);
    shader.getUniformInt("numberOfLights").set(lightPositions.length);

    const textureShader = this.textureshader;
    textureShader.use();
    const LTexture = shader.getUniformVec3Array("LightPositions");
    LTexture.set(lightPositions);
    textureShader.getUniformInt("numberOfLights").set(lightPositions.length);
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
    this.eye = camera.eye;
  }

  visitCameraNode(node: CameraNode, active: boolean): void {
    if (active) {
      let toWorld = this.transformations[this.transformations.length - 1];

      let cameraRasteriser = {
        eye: toWorld.mulVec(new Vector(0, 0, 0, 1)),
        center: toWorld.mulVec(new Vector(0, 0, -1, 1)),
        up: toWorld.mulVec(new Vector(0, 1, 0, 0)),
        fovy: 60,
        aspect: 500 / 500,
        near: 0.1,
        far: 100,
      };
      this.cameraToWorld = toWorld;
      this.setupCamera(cameraRasteriser);
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
    const fromWorld =
      this.inverseTransformations[this.inverseTransformations.length - 1];
    shader.getUniformMatrix("M").set(toWorld);
    let V = shader.getUniformMatrix("V");
    if (V && this.lookat) {
      V.set(this.lookat);
    }
    let P = shader.getUniformMatrix("P");
    if (P && this.perspective) {
      P.set(this.perspective);
    }

    const normal = fromWorld.transpose();
    normal.setVal(0, 3, 0);
    normal.setVal(1, 3, 0);
    normal.setVal(2, 3, 0);
    normal.setVal(3, 0, 0);
    normal.setVal(3, 1, 0);
    normal.setVal(3, 2, 0);
    normal.setVal(3, 3, 1);

    const N = shader.getUniformMatrix("N");
    if (N) {
      N.set(normal);
    }

    this.renderables.get(node).render(shader);
  }

  /**
   * Visits a Pyramid node
   * @param  {PyramidNode} node - The node to visit
   */
  visitPyramidNode(node: PyramidNode) {
    this.shader.use();
    let shader = this.shader;
    const toWorld = this.transformations[this.transformations.length - 1];
    const fromWorld =
      this.inverseTransformations[this.inverseTransformations.length - 1];

    shader.getUniformMatrix("M").set(toWorld);
    let V = shader.getUniformMatrix("V");
    if (V && this.lookat) {
      V.set(this.lookat);
    }
    let P = shader.getUniformMatrix("P");
    if (P && this.perspective) {
      P.set(this.perspective);
    }

    let normal = fromWorld.transpose();
    normal.setVal(0, 3, 0);
    normal.setVal(1, 3, 0);
    normal.setVal(2, 3, 0);
    normal.setVal(3, 0, 0);
    normal.setVal(3, 1, 0);
    normal.setVal(3, 2, 0);
    normal.setVal(3, 3, 1);

    const N = shader.getUniformMatrix("N");
    if (N) {
      N.set(normal);
    }

    this.renderables.get(node).render(shader);
  }

  /**
   * Visits a textured box node
   * @param  {TextureBoxNode} node - The node to visit
   */
  visitTextureBoxNode(node: TextureBoxNode) {
    this.textureshader.use();
    let shader = this.textureshader;
    const fromWorld = this.transformations[this.transformations.length - 1];
    const toWorld = this.transformations[this.transformations.length - 1];
    shader.getUniformMatrix("M").set(toWorld);
    let P = shader.getUniformMatrix("P");
    if (P && this.perspective) {
      P.set(this.perspective);
    }
    let normal = fromWorld.transpose();
    normal.setVal(0, 3, 0);
    normal.setVal(1, 3, 0);
    normal.setVal(2, 3, 0);
    normal.setVal(3, 0, 0);
    normal.setVal(3, 1, 0);
    normal.setVal(3, 2, 0);
    normal.setVal(3, 3, 1);

    const N = shader.getUniformMatrix("N");
    if (N) {
      N.set(normal);
    }
    shader.getUniformMatrix("V").set(this.lookat);

    this.renderables.get(node).render(shader);
  }

  visitTextureVideoBoxNode(node: TextureVideoBoxNode) {
    this.textureshader.use();
    let shader = this.textureshader;
    const fromWorld = this.transformations[this.transformations.length - 1];
    const toWorld = this.transformations[this.transformations.length - 1];
    shader.getUniformMatrix("M").set(toWorld);
    let P = shader.getUniformMatrix("P");
    if (P && this.perspective) {
      P.set(this.perspective);
    }
    let normal = fromWorld.transpose();
    normal.setVal(0, 3, 0);
    normal.setVal(1, 3, 0);
    normal.setVal(2, 3, 0);
    normal.setVal(3, 0, 0);
    normal.setVal(3, 1, 0);
    normal.setVal(3, 2, 0);
    normal.setVal(3, 3, 1);

    const N = shader.getUniformMatrix("N");
    if (N) {
      N.set(normal);
    }
    shader.getUniformMatrix("V").set(this.lookat);

    this.renderables.get(node).render(shader);
  }

  visitTextureTextBoxNode(node: TextureTextBoxNode): void {
    this.textureshader.use();
    let shader = this.textureshader;
    const fromWorld = this.transformations[this.transformations.length - 1];
    const toWorld = this.transformations[this.transformations.length - 1];
    shader.getUniformMatrix("M").set(toWorld);
    let P = shader.getUniformMatrix("P");
    if (P && this.perspective) {
      P.set(this.perspective);
    }
    let normal = fromWorld.transpose();
    normal.setVal(0, 3, 0);
    normal.setVal(1, 3, 0);
    normal.setVal(2, 3, 0);
    normal.setVal(3, 0, 0);
    normal.setVal(3, 1, 0);
    normal.setVal(3, 2, 0);
    normal.setVal(3, 3, 1);

    const N = shader.getUniformMatrix("N");
    if (N) {
      N.set(normal);
    }
    shader.getUniformMatrix("V").set(this.lookat);

    this.renderables.get(node).render(shader);
  }

  visitCustomShapeNode(node: CustomShapeNode) {}

  visitLightNode(node: LightNode): void {
    let toWorld = this.transformations[this.transformations.length - 1];

    this.lightPositions.push(toWorld.mulVec(new Vector(0, 0, 0, 1)));
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
      new RasterPyramid(this.gl, new Vector(0, 0, 0, 1), node.color)
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
        node.texture,
        node.normal
      )
    );
  }

  visitTextureVideoBoxNode(node: TextureVideoBoxNode) {
    let normalMap = "normalneutral.png";
    if (node.normal) {
      normalMap = node.normal;
    }
    this.objects.set(
      node,
      new RasterVideoTextureBox(
        this.gl,
        new Vector(-0.5, -0.5, -0.5, 1),
        new Vector(0.5, 0.5, 0.5, 1),
        node.texture,
        normalMap
      )
    );
  }
  visitTextureTextBoxNode(node: TextureTextBoxNode) {
    let normalMap = "normalneutral.png";
    if (node.normal) {
      normalMap = node.normal;
    }
    this.objects.set(
      node,
      new RasterTextTextureBox(
        this.gl,
        new Vector(-0.5, -0.5, -0.5, 1),
        new Vector(0.5, 0.5, 0.5, 1),
        node.texture,
        normalMap
      )
    );
  }

  visitCustomShapeNode(node: CustomShapeNode) {}

  visitCameraNode(node: CameraNode) {}
  visitLightNode(node: LightNode) {}
}
