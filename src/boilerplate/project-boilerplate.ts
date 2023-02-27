import "bootstrap";
import "bootstrap/scss/bootstrap.scss";
import Vector from "../math/vector";
import {
  AABoxNode,
  CameraNode,
  CustomShapeNode,
  GroupNode,
  LightNode,
  PyramidNode,
  SphereNode,
  TextureBoxNode,
  TextureTextBoxNode,
  TextureVideoBoxNode,
} from "../nodes";
import { Rotation, Scaling, Translation } from "../math/transformation";
import RayVisitor from "../raytracing/rayvisitor";
import {
  RasterSetupVisitor,
  RasterVisitor,
} from "../rasterisation/rastervisitor";
import Shader from "../shader/shader";
import Matrix from "../math/matrix";

import phongVertexPerspectiveShader from "../shader/phong-vertex-perspective-shader.glsl";
import phongFragmentShader from "../shader/phong-fragment-shader.glsl";

import textureVertexShader from "../shader/texture-vertex-perspective-shader.glsl";
import textureFragmentShader from "../shader/texture-fragment-shader.glsl";
import RasterBox from "../rasterisation/raster-box";
import {
  JumperNode,
  RotationNode,
  ScalerNode,
} from "../raytracing/animation-nodes";
import MouserayVisitor from "../raytracing/mouserayVisitor";
import AABox from "../objects/aabox";

export default interface PhongValues {
  ambient: number;
  diffuse: number;
  specular: number;
  shininess: number;
}

export interface CameraRaytracer {
  origin: Vector;
  width: number;
  height: number;
  alpha: number;
  toWorld: Matrix;
}

export interface CameraRasteriser {
  eye: Vector;
  center: Vector;
  up: Vector;
  fovy: number;
  aspect: number;
  near: number;
  far: number;
}

window.addEventListener("load", () => {
  const modeToggleForm = document.getElementById(
    "mode--toggle"
  ) as HTMLFormElement;

  let selectedNode:
    | SphereNode
    | PyramidNode
    | AABoxNode
    | CustomShapeNode
    | TextureBoxNode = null;
  let selectedGroupNode: GroupNode = null;

  //scene graph
  ///////////////////////////////////////////////////////////////////////////////////////////////

  // const sg = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));

  // sg.add(transformationNode);
  // transformationNode.add(
  //   new AABoxNode(new Vector(1.0, 0, 0, 0), transformationNode)
  // );

  // const secondTransformationNode = new GroupNode(
  //   new Translation(new Vector(2, 0, -4, 0))
  // );
  // sg.add(secondTransformationNode);

  // let vertices = [
  //   new Vector(-0.5, -0.5, -0.5, 1),
  //   new Vector(0.5, -0.5, -0.5, 1),
  //   new Vector(0.5, 0.5, -0.5, 1),
  //   new Vector(-0.5, 0.5, -0.5, 1),
  //   new Vector(-0.5, -0.5, 0.5, 1),
  //   new Vector(0.5, -0.5, 0.5, 1),
  //   new Vector(0.5, 0.5, 0.5, 1),
  //   new Vector(-0.5, 0.5, 0.5, 1),
  // ];
  // let indices = [
  //   0, 1, 2, 0, 2, 3, 1, 5, 6, 1, 6, 2, 5, 4, 6, 4, 7, 6, 0, 3, 7, 0, 7, 4, 3,
  //   2, 6, 3, 6, 7, 5, 4, 0, 5, 0, 1,
  // ];
  // secondTransformationNode.add(
  //   new CustomShapeNode(
  //     vertices,
  //     indices,
  //     new Vector(0.5, 1, 0, 0),
  //     secondTransformationNode
  //   )
  // );

  // create a rotation node
  // const animation1 = new ScalerNode(
  //   transformationNode,
  //   new Vector(1, 2, 1, 0),
  //   0.001
  // );
  let sg = new GroupNode(new Translation(new Vector(0, 0, -15, 0)));

  const camera1 = new CameraNode(true);
  const cameraTranslation = new GroupNode(
    new Translation(new Vector(0, 0, 12, 0))
  );
  cameraTranslation.add(camera1);
  sg.add(cameraTranslation);

  const light1 = new LightNode();
  const lightTranslation = new GroupNode(
    new Translation(new Vector(-1, -2, 9, 0))
  );
  lightTranslation.add(light1);
  sg.add(lightTranslation);

  const createWindow = (xTranslation: number) => {
    const windowScaling = new GroupNode(new Scaling(new Vector(4, 5, 1, 0)));
    const windowTranslation = new GroupNode(
      new Translation(new Vector(xTranslation, 0.5, 0, 0))
    );
    const window = new AABoxNode(
      new Vector(0.7, 0.5, 0.0, 1),
      new Vector(0.7, 0.5, 0.0, 1),
      windowTranslation
    );
    windowScaling.add(window);
    windowTranslation.add(windowScaling);
    sg.add(windowTranslation);

    const windowTopBarScaling = new GroupNode(
      new Scaling(new Vector(4, 0.3, 1.1, 0))
    );
    const windowTopBarTranslation = new GroupNode(
      new Translation(new Vector(0, 2.6, 0, 0))
    );
    const windowTopBar = new AABoxNode(
      new Vector(1.0, 0.1, 0, 1),
      new Vector(1.0, 0.1, 0, 1),
      windowTranslation
    );
    windowTopBarScaling.add(windowTopBar);
    windowTopBarTranslation.add(windowTopBarScaling);
    windowTranslation.add(windowTopBarTranslation);

    const windowSceneScaling = new GroupNode(
      new Scaling(new Vector(3.7, 4.2, 1.1, 0))
    );
    const windowSceneTranslation = new GroupNode(
      new Translation(new Vector(0, -0.2, 0, 0))
    );
    const windowScene = new AABoxNode(
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      windowTranslation
    );
    windowSceneScaling.add(windowScene);
    windowSceneTranslation.add(windowSceneScaling);
    windowTranslation.add(windowSceneTranslation);

    return windowSceneTranslation;
  };

  const leftWindowSceneTranslation = createWindow(-2.2);
  const rightWindowSceneTranslation = createWindow(2.2);

  const pyramidScaling = new GroupNode(
    new Scaling(new Vector(0.5, 0.5, 0.5, 0))
  );
  const pyramidTranslation = new GroupNode(
    new Translation(new Vector(-1, 1, 1, 0))
  );
  const pyramid = new PyramidNode(
    new Vector(1.0, 1.0, 1.0, 1),
    new Vector(0.5, 0.1, 0.3, 1),
    new Vector(0.5, 0.1, 0.3, 1),
    pyramidScaling
  );
  pyramidScaling.add(pyramid);
  pyramidTranslation.add(pyramidScaling);
  leftWindowSceneTranslation.add(pyramidTranslation);

  const sphereScaling = new GroupNode(
    new Scaling(new Vector(0.5, 0.5, 0.5, 0))
  );
  const sphereTranslation = new GroupNode(
    new Translation(new Vector(0, 0, 1, 0))
  );
  const sphere = new SphereNode(new Vector(0.5, 0.1, 0.3, 1), sphereScaling);

  sphereScaling.add(sphere);
  sphereTranslation.add(sphereScaling);
  leftWindowSceneTranslation.add(sphereTranslation);

  const aaboxScaling = new GroupNode(new Scaling(new Vector(0.5, 0.5, 0.5, 0)));
  const aaboxTranslation = new GroupNode(
    new Translation(new Vector(1, -1, 1, 0))
  );
  const aabox = new AABoxNode(
    new Vector(0.5, 0.1, 0.3, 1),
    new Vector(0.5, 0.1, 0.3, 1),
    aaboxScaling
  );
  aaboxScaling.add(aabox);
  aaboxTranslation.add(aaboxScaling);
  leftWindowSceneTranslation.add(aaboxTranslation);

  // texture only comes after first traversal; cube just stays black now
  const textureBoxScaling = new GroupNode(
    new Scaling(new Vector(2.0, 2.0, 2.0, 0))
  );
  const textureBoxTranslation = new GroupNode(
    new Translation(new Vector(1, -1, 1, 0))
  );
  const textureBox = new TextureTextBoxNode("der assitoni", textureBoxScaling);

  const textureBoxRotation = new GroupNode(
    new Rotation(new Vector(0, 0, 1, 0), Math.PI)
  );

  textureBoxRotation.add(textureBox)
  textureBoxScaling.add(textureBoxRotation);
  textureBoxTranslation.add(textureBoxScaling);
  rightWindowSceneTranslation.add(textureBoxTranslation);

  const taskbarIconScaling = new GroupNode(
    new Scaling(new Vector(1, 1, 1.1, 0))
  );
  const createTaskbarIcon = (xPos: number) => {
    const taskbarIcon = new AABoxNode(
      new Vector(2, 0.1, 0, 1),
      new Vector(2, 0.1, 0, 1),
      taskbarIconScaling
    );
    const taskbarIconTranslation = new GroupNode(
      new Translation(new Vector(xPos, 0, 0, 0))
    );
    taskbarIconScaling.add(taskbarIcon);
    taskbarIconTranslation.add(taskbarIconScaling);
    return taskbarIconTranslation;
  };

  const taskbarScaling = new GroupNode(new Scaling(new Vector(8.5, 1, 1, 0)));
  const taskbarTranslation = new GroupNode(
    new Translation(new Vector(0, -3, 0, 0))
  );
  const taskbar = new AABoxNode(
    new Vector(0.5, 0.5, 0.5, 1),
    new Vector(0.5, 0.5, 0.5, 1),
    taskbarScaling
  );
  taskbarScaling.add(taskbar);
  taskbarTranslation.add(taskbarScaling);
  sg.add(taskbarTranslation);

  const leftTaskbarIcon = createTaskbarIcon(-3.5);
  taskbarTranslation.add(leftTaskbarIcon);

  const rightTaskbarIcon = createTaskbarIcon(-2.2);
  taskbarTranslation.add(rightTaskbarIcon);

  ///////////////////////////////////////////////////////////////////////////////////////////////
  const transformationNode = new GroupNode(
    new Translation(new Vector(0, 5, -5, 0))
  );
  transformationNode.add(
    new AABoxNode(
      new Vector(0, 0, 1, 0),
      new Vector(0, 0, 1, 0),
      transformationNode
    )
  );
  const animation1 = new JumperNode(
    transformationNode,
    new Vector(2, 1, 1, 0),
    0.002
  );
  // sg.add(transformationNode);

  // animation1.toggleActive();

  // const thirdTransformationNode = new GroupNode(
  //   new Translation(new Vector(0, 0.5, -7, 0))
  // );
  // sg.add(thirdTransformationNode);
  // thirdTransformationNode.add(new AABoxNode(new Vector(0, 0, 1, 0)));

  ///////////////////////////////////////////////////////////////////////////////////////////////
  //raster
  const rasterCanvas = document.getElementById(
    "raster-canvas"
  ) as HTMLCanvasElement;

  const rasterContext: WebGL2RenderingContext =
    rasterCanvas.getContext("webgl2");
  // console.log(rasterContext); //ist 1000?!?!?!?! nicht 800
  const setupVisitor = new RasterSetupVisitor(rasterContext);
  setupVisitor.setup(sg);

  const phongShader = new Shader(
    rasterContext,
    phongVertexPerspectiveShader,
    phongFragmentShader
  );

  const textureShader = new Shader(
    rasterContext,
    textureVertexShader,
    textureFragmentShader
  );

  const rasterVisitor = new RasterVisitor(
    rasterContext,
    phongShader,
    textureShader,
    setupVisitor.objects
  );

  phongShader.load();
  textureShader.load();

  //ray
  const rayCanvas = document.getElementById("ray-canvas") as HTMLCanvasElement;

  let phongValues = {
    ambient: 0.8,
    diffuse: 0.5,
    specular: 0.5,
    shininess: 10,
  };

  let rayContext: CanvasRenderingContext2D = rayCanvas.getContext("2d");

  const mouseRayVisitor = new MouserayVisitor(
    rayCanvas.width,
    rayCanvas.height
  );

  const rayVisitor = new RayVisitor(
    rayContext,
    rayCanvas.width,
    rayCanvas.height
  );

  // default render method
  let renderMode = "raytracing";

  modeToggleForm.addEventListener("change", (event: Event) => {
    const input = event.target as HTMLInputElement;
    renderMode = input.value;

    console.log("Mode toggled: " + renderMode);

    if (renderMode === "rasterization") {
      rayCanvas.style.display = "none";
      rasterCanvas.style.display = "block";
    } else {
      rasterCanvas.style.display = "none";
      rayCanvas.style.display = "block";
    }
  });

  // const lightPositions = [new Vector(1, 1, -1, 1), new Vector(5, 10, -1, 5)];
  // const rayCamera = {
  //   origin: new Vector(0, 0, -15, 1),
  //   width: rayCanvas.width,
  //   height: rayCanvas.height,
  //   alpha: Math.PI / 3,
  // };
  //
  // let rasterCamera = {
  //   eye: new Vector(0, 0, 0, 1),
  //   center: new Vector(0, 0, -1, 1),
  //   up: new Vector(0, 1, 0, 0),
  //   fovy: 60,
  //   aspect: rasterCanvas.width / rasterCanvas.height,
  //   near: 0.1,
  //   far: 100,
  // };

  let lastTimestamp = performance.now();

  window.requestAnimationFrame(animate);

  function animate(timestamp: number) {
    if (renderMode == "rasterization") {
      rasterVisitor.renderWithPhong(sg, null, null, phongValues);
    } else if (renderMode == "raytracing") {
      rayVisitor.render(sg, null, null, phongValues);
    }
    animation1.simulate(timestamp - lastTimestamp);

    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
  }

  //tastatur eingaben
  /////////////////////////////////////////////////////////////////////////////////////////////////////

  let translationSize = 0.2;
  let scaleSize = 0.1;
  let rotationAmount = 20;

  window.addEventListener("keydown", function (event) {
    switch (event.key) {
      case "w": //hoch
        translate(new Vector(0, translationSize, 0, 0), selectedGroupNode);
        break;
      case "s": //runter
        translate(new Vector(0, -translationSize, 0, 0), selectedGroupNode);
        break;
      case "a": //links
        translate(new Vector(-translationSize, 0, 0, 0), selectedGroupNode);
        break;
      case "d": //rechts
        translate(new Vector(translationSize, 0, 0, 0), selectedGroupNode);
        break;
      case "e": //vor
        translate(new Vector(0, 0, translationSize, 0), selectedGroupNode);
        break;
      case "q": //zurück
        translate(new Vector(0, 0, -translationSize, 0), selectedGroupNode);
        break;
      case "x": //um x achse rotieren
        rotate(new Vector(1, 0, 0, 0), rotationAmount, selectedGroupNode);
        break;
      case "y": //um y achse rotieren
        rotate(new Vector(0, 1, 0, 0), rotationAmount, selectedGroupNode);
        break;
      case "c": //um z achse rotieren
        rotate(new Vector(0, 0, 1, 0), rotationAmount, selectedGroupNode);
        break;
      case "r": //X skalieren größer
        scale(new Vector(1 + scaleSize, 1, 1, 0), selectedGroupNode);
        break;
      case "f": //Y skalieren größer
        scale(new Vector(1, 1 + scaleSize, 1, 0), selectedGroupNode);
        break;
      case "v": //Z skalieren größer
        scale(new Vector(1, 1, 1 + scaleSize, 0), selectedGroupNode);
        break;
      case "t": //X skalieren kleiner
        scale(new Vector(1 - scaleSize, 1, 1, 0), selectedGroupNode);
        break;
      case "g": //Y skalieren kleiner
        scale(new Vector(1, 1 - scaleSize, 1, 0), selectedGroupNode);
        break;
      case "b": //Z skalieren kleiner
        scale(new Vector(1, 1, 1 - scaleSize, 0), selectedGroupNode);
        break;
      case "m": //Z skalieren kleiner
        scale(new Vector(1, 1, 1, 0), selectedGroupNode);
        break;
    }
  });

  //TODO change phong parameters for rasterizer aswell
  const shininessElement = document.getElementById(
    "shininess"
  ) as HTMLInputElement;
  shininessElement.onchange = () => {
    phongValues.shininess = Number(shininessElement.value);
    window.requestAnimationFrame(animate);
  };

  const kA = document.getElementById("kAmbient") as HTMLInputElement;
  kA.onchange = () => {
    phongValues.ambient = Number(kA.value);
    window.requestAnimationFrame(animate);
  };

  const kD = document.getElementById("kDiffuse") as HTMLInputElement;
  kD.onchange = () => {
    phongValues.diffuse = Number(kD.value);
    window.requestAnimationFrame(animate);
  };

  const kS = document.getElementById("kSpecular") as HTMLInputElement;
  kS.onchange = () => {
    phongValues.specular = Number(kS.value);
    window.requestAnimationFrame(animate);
  };

  //zu einer methode machen die abhängig vom current context wählen kann?
  rasterCanvas.addEventListener("mousedown", (event) => {
    let mx = event.offsetX;
    let my = event.offsetY;
    console.log(mx, my + " raster");
    selectedNode = mouseRayVisitor.click(sg, null, mx, my, rasterContext);
    if (selectedNode != null) {
      selectedGroupNode = selectedNode.parent;
    }
  });

  rayCanvas.addEventListener("mousedown", (event) => {
    let mx = event.offsetX;
    let my = event.offsetY;
    console.log(mx, my + " ray");

    selectedNode = mouseRayVisitor.click(sg, null, mx, my, rayContext);
    if (selectedNode != null) {
      selectedGroupNode = selectedNode.parent;
    }
  });
});
export function rotate(axis: Vector, angle: number, node: GroupNode) {
  let oldMatrix = node.transform.getMatrix();
  let oldMatrixInverse = node.transform.getInverseMatrix();
  let newTransformation = new Rotation(axis, angle);
  newTransformation.matrix = oldMatrix.mul(newTransformation.getMatrix());
  newTransformation.inverse = oldMatrixInverse.mul(
    oldMatrixInverse.mul(newTransformation.getInverseMatrix())
  );
  node.transform = newTransformation;
}

export function translate(translation: Vector, node: GroupNode) {
  let oldMatrix = node.transform.getMatrix();
  let oldMatrixInverse = node.transform.getInverseMatrix();
  let newTransformation = new Translation(translation);
  newTransformation.matrix = oldMatrix.mul(newTransformation.getMatrix());
  newTransformation.inverse = oldMatrixInverse.mul(
    newTransformation.getInverseMatrix()
  );
  node.transform = newTransformation;
}

export function scale(scale: Vector, node: GroupNode) {
  let oldMatrix = node.transform.getMatrix();
  let oldMatrixInverse = node.transform.getInverseMatrix();
  let newTransformation = new Scaling(scale);
  newTransformation.matrix = oldMatrix.mul(newTransformation.getMatrix());
  newTransformation.inverse = oldMatrixInverse.mul(
    oldMatrixInverse.mul(newTransformation.getInverseMatrix())
  );
  node.transform = newTransformation;
}
//TODO
//rotation fixen bei pyramid
