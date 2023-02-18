import "bootstrap";
import "bootstrap/scss/bootstrap.scss";
import Vector from "../math/vector";
import {
  AABoxNode,
  GroupNode,
  PyramidNode,
  SphereNode,
  TextureBoxNode,
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

window.addEventListener("load", () => {
  const modeToggleForm = document.getElementById(
    "mode--toggle"
  ) as HTMLFormElement;

  //scene graph
  ///////////////////////////////////////////////////////////////////////////////////////////////

  const sg = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));

  const transformationNode = new GroupNode(
    new Translation(new Vector(0, 0, -10, 0))
  );
  sg.add(transformationNode);
  transformationNode.add(new AABoxNode(new Vector(0.5, 0, 0, 0)));

  const secondTransformationNode = new GroupNode(
    new Translation(new Vector(0, 0, -4, 0))
  );
  sg.add(secondTransformationNode);
  // secondTransformationNode.add(new AABoxNode(new Vector(0.5, 1, 0, 0)));
  scale(new Vector(1, 1, 1, 0), secondTransformationNode);

  // create a rotation node
  const animation1 = new ScalerNode(
    transformationNode,
    new Vector(1, 2, 1, 0),
    0.001
  );

  // const animation1 = new JumperNode(
  //   transformationNode,
  //   new Vector(2, 1, 1, 0),
  //   0.002
  // );

  animation1.toggleActive();

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

  const lightPositions = [new Vector(1, 1, -1, 1), new Vector(5, 10, -1, 5)];
  const rayCamera = {
    origin: new Vector(0, 0, 0, 1),
    width: rayCanvas.width,
    height: rayCanvas.height,
    alpha: Math.PI / 3,
  };

  let rasterCamera = {
    eye: new Vector(0, 0, 0, 1),
    center: new Vector(0, 0, -1, 1),
    up: new Vector(0, 1, 0, 0),
    fovy: 60,
    aspect: rasterCanvas.width / rasterCanvas.height,
    near: 0.1,
    far: 100,
  };

  let lastTimestamp = performance.now();

  window.requestAnimationFrame(animate);

  function animate(timestamp: number) {
    if (renderMode == "rasterization") {
      rasterVisitor.renderWithPhong(
        sg,
        rasterCamera,
        lightPositions,
        phongValues
      );
    } else if (renderMode == "raytracing") {
      rayVisitor.render(sg, rayCamera, lightPositions, phongValues);
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
        translate(new Vector(0, translationSize, 0, 0), transformationNode);
        break;
      case "s": //runter
        translate(new Vector(0, -translationSize, 0, 0), transformationNode);
        break;
      case "a": //links
        translate(new Vector(-translationSize, 0, 0, 0), transformationNode);
        break;
      case "d": //rechts
        translate(new Vector(translationSize, 0, 0, 0), transformationNode);
        break;
      case "e": //vor
        translate(new Vector(0, 0, translationSize, 0), transformationNode);
        break;
      case "q": //zurück
        translate(new Vector(0, 0, -translationSize, 0), transformationNode);
        break;
      case "x": //um x achse rotieren
        rotate(new Vector(1, 0, 0, 0), rotationAmount, transformationNode);
        break;
      case "y": //um y achse rotieren
        rotate(new Vector(0, 1, 0, 0), rotationAmount, transformationNode);
        break;
      case "c": //um z achse rotieren
        rotate(new Vector(0, 0, 1, 0), rotationAmount, transformationNode);
        break;
      case "r": //X skalieren größer
        scale(new Vector(1 + scaleSize, 1, 1, 0), transformationNode);
        break;
      case "f": //Y skalieren größer
        scale(new Vector(1, 1 + scaleSize, 1, 0), transformationNode);
        break;
      case "v": //Z skalieren größer
        scale(new Vector(1, 1, 1 + scaleSize, 0), transformationNode);
        break;
      case "t": //X skalieren kleiner
        scale(new Vector(1 - scaleSize, 1, 1, 0), transformationNode);
        break;
      case "g": //Y skalieren kleiner
        scale(new Vector(1, 1 - scaleSize, 1, 0), transformationNode);
        break;
      case "b": //Z skalieren kleiner
        scale(new Vector(1, 1, 1 - scaleSize, 0), transformationNode);
        break;
      case "m": //Z skalieren kleiner
        scale(new Vector(1, 1, 1, 0), transformationNode);
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
    mouseRayVisitor.click(sg, rayCamera, mx, my, rasterContext);
  });

  rayCanvas.addEventListener("mousedown", (event) => {
    let mx = event.offsetX;
    let my = event.offsetY;
    mouseRayVisitor.click(sg, rayCamera, mx, my, rayContext);
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
