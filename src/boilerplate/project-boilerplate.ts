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
import { RasterSetupVisitor, RasterVisitor } from "../rasterisation/rastervisitor";
import Shader from "../shader/shader";
import Matrix from "../math/matrix";

import phongVertexPerspectiveShader from "../shader/phong-vertex-perspective-shader.glsl";
import phongFragmentShader from "../shader/phong-fragment-shader.glsl";

import textureVertexShader from "../shader/texture-vertex-perspective-shader.glsl";
import textureFragmentShader from "../shader/texture-fragment-shader.glsl";
import RasterBox from "../rasterisation/raster-box";
import { DriverNode, JumperNode, RotationNode, ScalerNode } from "../raytracing/animation-nodes";
import MouserayVisitor from "../raytracing/mouserayVisitor";
import AABox from "../objects/aabox";

interface SceneObj {
  rootNode: GroupNode;
  nodes: any[];
  phongValues: PhongValues;
}

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

let scene: SceneObj;

window.addEventListener("load", () => {
  const modeToggleForm = document.getElementById("mode--toggle") as HTMLFormElement;

  //null in the beginning, changes on cklick
  let selectedNode: SphereNode | PyramidNode | AABoxNode | CustomShapeNode | TextureVideoBoxNode | TextureTextBoxNode | TextureBoxNode = null;
  let selectedGroupNode: GroupNode = null;

  //scene graph
  ///////////////////////////////////////////////////////////////////////////////////////////////
  let nodes: any[] = [];

  let sg = new GroupNode(new Translation(new Vector(0, 0, -15, 0)));

  const camera1 = new CameraNode(true);
  const cameraTranslation = new GroupNode(new Translation(new Vector(0, 0, 12, 0)));
  cameraTranslation.add(camera1);
  sg.add(cameraTranslation);

  const light1 = new LightNode();
  const lightTranslation = new GroupNode(new Translation(new Vector(-1, -2, 9, 0)));
  lightTranslation.add(light1);
  sg.add(lightTranslation);

  const createWindow = (xTranslation: number, id: number, windowNaming: string) => {
    const windowScaling = new GroupNode(new Scaling(new Vector(5, 6, 1, 0)));
    const windowTranslation = new GroupNode(new Translation(new Vector(xTranslation, 0.5, 0, 0)));
    const window = new AABoxNode(new Vector(0.4, 0.3, 0.0, 1), windowTranslation);
    windowScaling.add(window);
    windowTranslation.add(windowScaling);
    sg.add(windowTranslation);

    const windowTopBarScaling = new GroupNode(new Scaling(new Vector(5, 0.3, 1.1, 0)));
    const windowTopBarTranslation = new GroupNode(new Translation(new Vector(0, 2.8, 0, 0)));
    const windowTopBar = new AABoxNode(new Vector(0.7, 0.1, 0, 1), windowTranslation);
    const windowNameScaling = new GroupNode(new Scaling(new Vector(1, 1, 1, 0)));
    const windowNameTranslation = new GroupNode(new Translation(new Vector(-2, 2.5, 0.1, 0)));
    const windowNameRotation = new GroupNode(new Rotation(new Vector(0, 0, 1, 0), Math.PI));

    // textureBoxRotation.add(textureBox);
    // textureBoxScaling.add(textureBoxRotation);
    // textureBoxTranslation.add(textureBoxScaling);
    // rightWindowSceneTranslation.add(textureBoxTranslation);

    const windowName = new TextureTextBoxNode(windowNaming, windowTranslation);

    windowNameRotation.add(windowName);
    windowNameScaling.add(windowNameRotation);
    windowNameTranslation.add(windowNameScaling);
    windowTranslation.add(windowNameTranslation);

    windowTopBarScaling.add(windowTopBar);
    windowTopBarTranslation.add(windowTopBarScaling);
    windowTranslation.add(windowTopBarTranslation);

    //minimierungsschaltfläche
    const minimizerTranslation = new GroupNode(new Translation(new Vector(2.2, 2.8, 0.5, 0)));
    const minimizerScaling = new GroupNode(new Scaling(new Vector(0.5, 0.3, 0.5, 0)), id);
    const minimizer = new AABoxNode(new Vector(0.3, 0.1, 1, 1), minimizerScaling);

    minimizerScaling.add(minimizer);
    minimizerTranslation.add(minimizerScaling);
    windowTranslation.add(minimizerTranslation);

    const windowSceneScaling = new GroupNode(new Scaling(new Vector(4.5, 5.0, 1.1, 0)));
    const windowSceneTranslation = new GroupNode(new Translation(new Vector(0, -0.2, 0, 0)));
    const windowScene = new AABoxNode(new Vector(0.9, 0.9, 0.9, 1), windowTranslation);
    windowSceneScaling.add(windowScene);
    windowSceneTranslation.add(windowSceneScaling);
    windowTranslation.add(windowSceneTranslation);

    return windowTranslation;
  };

  const leftWindowSceneTranslation = createWindow(-2.8, 1, "Left");
  const rightWindowSceneTranslation = createWindow(2.8, 2, "Right");

  const pyramidScaling = new GroupNode(new Scaling(new Vector(0.5, 0.5, 0.5, 0)));
  const pyramidTranslation = new GroupNode(new Translation(new Vector(-1, 1, 1, 0)));
  const pyramid = new PyramidNode(new Vector(0.5, 0.1, 0.3, 1), pyramidScaling);
  pyramidScaling.add(pyramid);
  pyramidTranslation.add(pyramidScaling);
  leftWindowSceneTranslation.add(pyramidTranslation);

  const sphereScaling = new GroupNode(new Scaling(new Vector(0.3, 0.3, 0.3, 0)));
  const sphereTranslation = new GroupNode(new Translation(new Vector(0, 0, 1, 0)));
  const sphere = new SphereNode(new Vector(0.5, 0.1, 0.3, 1), sphereScaling);

  sphereScaling.add(sphere);
  sphereTranslation.add(sphereScaling);
  leftWindowSceneTranslation.add(sphereTranslation);

  const aaboxScaling = new GroupNode(new Scaling(new Vector(0.5, 0.5, 0.5, 0)));
  const aaboxTranslation = new GroupNode(new Translation(new Vector(1, -1, 1, 0)));
  const aabox = new AABoxNode(new Vector(0.5, 0.1, 0.3, 1), aaboxScaling);
  aaboxScaling.add(aabox);
  aaboxTranslation.add(aaboxScaling);
  leftWindowSceneTranslation.add(aaboxTranslation);

  // texture only comes after first traversal; cube just stays black now
  const textureBoxScaling = new GroupNode(new Scaling(new Vector(2.0, 2.0, 2.0, 0)));
  const textureBoxTranslation = new GroupNode(new Translation(new Vector(1, -1, 1, 0)));
  const textureBox = new TextureVideoBoxNode("assitoni.mp4", textureBoxScaling);

  const textureBoxRotation = new GroupNode(new Rotation(new Vector(0, 0, 1, 0), Math.PI));

  textureBoxRotation.add(textureBox);
  textureBoxScaling.add(textureBoxRotation);
  textureBoxTranslation.add(textureBoxScaling);
  rightWindowSceneTranslation.add(textureBoxTranslation);

  const createTaskbarIcon = (xPos: number, id: number, color: Vector) => {
    const taskbarIconTranslation = new GroupNode(new Translation(new Vector(xPos, 0.01, 0, 0)), id);
    const taskbarIconScaling = new GroupNode(new Scaling(new Vector(1, 1, 1.1, 0)));
    const taskbarIcon = new AABoxNode(color, taskbarIconTranslation);
    taskbarIconScaling.add(taskbarIcon);
    taskbarIconTranslation.add(taskbarIconScaling);
    return taskbarIconTranslation;
  };

  const taskbarScaling = new GroupNode(new Scaling(new Vector(15, 1, 1, 0)));
  const taskbarTranslation = new GroupNode(new Translation(new Vector(0, -6.2, 0, 0)));
  const taskbar = new AABoxNode(new Vector(0.5, 0.5, 0.5, 1), taskbarScaling);
  taskbarScaling.add(taskbar);
  taskbarTranslation.add(taskbarScaling);
  sg.add(taskbarTranslation);

  const leftTaskbarIcon = createTaskbarIcon(-3.5, 10, new Vector(0.5, 0.1, 0.3, 1));
  taskbarTranslation.add(leftTaskbarIcon);

  const rightTaskbarIcon = createTaskbarIcon(-2.2, 11, new Vector(0.1, 0.5, 0.3, 1));
  taskbarTranslation.add(rightTaskbarIcon);

  ///////////////////////////////////////////////////////////////////////////////////////////////
  //Animation Nodes
  let animation1 = new DriverNode(selectedGroupNode, new Vector(0, -5, -30, 0), 0.0002);
  let minimizeScaling = new ScalerNode(selectedGroupNode, new Vector(0.1, 0.1, 0.1, 0), true, 0.0002);

  let rotationSphere = new RotationNode(aaboxScaling, new Vector(1, 0, 0, 0));
  rotationSphere.toggleActive();

  let rotationPyramid = new RotationNode(pyramidScaling, new Vector(0, 1, 0, 0), 0.0003);
  rotationPyramid.toggleActive();

  ///////////////////////////////////////////////////////////////////////////////////////////////
  //raster
  const rasterCanvas = document.getElementById("raster-canvas") as HTMLCanvasElement;

  const rasterContext: WebGL2RenderingContext = rasterCanvas.getContext("webgl2");
  const setupVisitor = new RasterSetupVisitor(rasterContext);
  setupVisitor.setup(sg);

  const phongShader = new Shader(rasterContext, phongVertexPerspectiveShader, phongFragmentShader);

  const textureShader = new Shader(rasterContext, textureVertexShader, textureFragmentShader);

  const rasterVisitor = new RasterVisitor(rasterContext, phongShader, textureShader, setupVisitor.objects);

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

  const mouseRayVisitor = new MouserayVisitor(rayCanvas.width, rayCanvas.height);

  const rayVisitor = new RayVisitor(rayContext, rayCanvas.width, rayCanvas.height);

  //default is rasterization
  let renderMode = "rasterization";
  rayCanvas.style.display = "none";
  rasterCanvas.style.display = "block";

  //if button is clicked, the renderer Changes
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

  //buttons o and p change the renderer
  window.addEventListener("keydown", function (event) {
    switch (event.key) {
      case "o": //rasterization mode
        renderMode = "rasterization";
        console.log("Mode toggled: " + renderMode);
        rayCanvas.style.display = "none";
        rasterCanvas.style.display = "block";
        //set the radioButton to checked
        let rasterizationButton = document.getElementById("rasterization") as HTMLInputElement;
        rasterizationButton.checked = true;
        break;

      case "p": //raytracing mode
        renderMode = "raytracing";
        console.log("Mode toggled: " + renderMode);
        rasterCanvas.style.display = "none";
        rayCanvas.style.display = "block";
        //set the radioButton to checked
        let raytracingButton = document.getElementById("raytracing") as HTMLInputElement;
        raytracingButton.checked = true;
        break;
    }
  });

  let lastTimestamp = performance.now();

  window.requestAnimationFrame(animate);

  function animate(timestamp: number) {
    if (renderMode == "rasterization") {
      rasterVisitor.renderWithPhong(sg, null, null, phongValues);
    } else if (renderMode == "raytracing") {
      rayVisitor.render(sg, null, null, phongValues);
    }
    animation1.simulate(timestamp - lastTimestamp);
    rotationSphere.simulate(timestamp - lastTimestamp);
    rotationPyramid.simulate(timestamp - lastTimestamp);
    minimizeScaling.simulate(timestamp - lastTimestamp);

    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
  }

  //tastatur eingaben
  /////////////////////////////////////////////////////////////////////////////////////////////////////

  let translationSize = 0.2;
  let scaleSize = 0.1;
  let rotationAmount = 0.3;

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

  const shininessElement = document.getElementById("shininess") as HTMLInputElement;
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

  rasterCanvas.addEventListener("mousedown", (event) => {
    let mx = event.offsetX;
    let my = event.offsetY;
    selectedNode = mouseRayVisitor.click(sg, null, mx, my, rasterContext);
    if (selectedNode != null) {
      selectedGroupNode = selectedNode.parent;
      checkactions();
    }
  });

  rayCanvas.addEventListener("mousedown", (event) => {
    let mx = event.offsetX;
    let my = event.offsetY;
    selectedNode = mouseRayVisitor.click(sg, null, mx, my, rayContext);
    if (selectedNode != null) {
      selectedGroupNode = selectedNode.parent;
      checkactions();
    }
  });

  let maximisedLeft = true;
  let maximisedRight = true;

  function checkactions() {
    if (selectedGroupNode.id == null) {
      //jumps once
      animation1 = new JumperNode(selectedGroupNode, new Vector(0, 0.5, 0, 0), 0.005, true);
      animation1.toggleActive();
      //if left minimize btn is selected, animate the minimization
    } else if (selectedGroupNode.id == 1 && maximisedLeft) {
      animation1 = new DriverNode(leftWindowSceneTranslation, new Vector(-2, -14, 0, 0), 0.001);
      maximisedLeft = false;
      animation1.toggleActive();
    }
    //if right minimize btn is selected, animate the minimization
    else if (selectedGroupNode.id == 2 && maximisedRight) {
      animation1 = new DriverNode(rightWindowSceneTranslation, new Vector(-6, -14, 0, 0), 0.001);
      maximisedRight = false;
      animation1.toggleActive();
    }
    //if left maximize btn is selected, animate the maximization
    else if (selectedGroupNode.id == 10 && !maximisedLeft) {
      animation1 = new DriverNode(leftWindowSceneTranslation, new Vector(2, 14, 0, 0), 0.001);
      maximisedLeft = true;
      animation1.toggleActive();

      // scale(new Vector(10, 10, 10, 0), leftWindowSceneTranslation);
      //if right maximize btn is selected, animate the maximization
    } else if (selectedGroupNode.id == 11 && !maximisedRight) {
      animation1 = new DriverNode(rightWindowSceneTranslation, new Vector(6, 14, 0, 0), 0.001);
      maximisedRight = true;
      animation1.toggleActive();
    }
  }

  // download and import scene as JSON
  //download
  let downloadButton = document.getElementById("downloadButton");
  downloadButton.onclick = () => {
    scene = {
      rootNode: sg,
      nodes: nodes,
      phongValues: phongValues,
    };
    var anchor = document.createElement("a");
    var file = new Blob([JSON.stringify(scene)], { type: "text/plain" });
    anchor.href = URL.createObjectURL(file);
    anchor.download = "scene";
    anchor.click();
  };
});
export function rotate(axis: Vector, angle: number, node: GroupNode) {
  let oldMatrix = node.transform.getMatrix();
  let oldMatrixInverse = node.transform.getInverseMatrix();
  let newTransformation = new Rotation(axis, angle);
  newTransformation.matrix = oldMatrix.mul(newTransformation.getMatrix());
  newTransformation.inverse = newTransformation.getInverseMatrix().mul(oldMatrixInverse);
  node.transform = newTransformation;
}

export function translate(translation: Vector, node: GroupNode) {
  let oldMatrix = node.transform.getMatrix();
  let oldMatrixInverse = node.transform.getInverseMatrix();
  let newTransformation = new Translation(translation);
  newTransformation.matrix = oldMatrix.mul(newTransformation.getMatrix());
  newTransformation.inverse = newTransformation.getInverseMatrix().mul(oldMatrixInverse);
  node.transform = newTransformation;
}

export function scale(scale: Vector, node: GroupNode) {
  let oldMatrix = node.transform.getMatrix();
  let oldMatrixInverse = node.transform.getInverseMatrix();
  let newTransformation = new Scaling(scale);
  newTransformation.matrix = oldMatrix.mul(newTransformation.getMatrix());
  newTransformation.inverse = newTransformation.getInverseMatrix().mul(oldMatrixInverse);

  node.transform = newTransformation;
}
