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

  let mode: string;
  //scene graph
  ////////////////////////////////////////////////////////////////////////////////////////////////

  const sg = new GroupNode(new Translation(new Vector(0, 0, -5, 0)));
  let gnTranslation = new Translation(new Vector(0, 0, 0, 0));
  let gnRotationX = new Rotation(new Vector(1, 0, 0, 0), 0);
  let gnRotationY = new Rotation(new Vector(0, 1, 0, 0), 0);
  let gnRotationZ = new Rotation(new Vector(0, 0, 1, 0), 0);

  let gnScaling = new Scaling(new Vector(1, 1, 1, 0));
  const gn1 = new GroupNode(gnTranslation);
  const gn2 = new GroupNode(gnRotationX);
  const gn3 = new GroupNode(gnRotationY);
  const gn4 = new GroupNode(gnRotationZ);

  const gn5 = new GroupNode(gnScaling);
  sg.add(gn1);
  gn1.add(gn2);
  gn2.add(gn3);
  gn3.add(gn4);

  gn4.add(gn5);
  const cube = new TextureBoxNode("hci-logo.png");
  gn5.add(new AABoxNode(new Vector(0.5, 0, 0, 0)));
  gn5.add(cube);

  ///////////////////////////////////////////////////////////////////////////////////////////////
  //raster
  const rasterCanvas = document.getElementById(
    "raster-canvas"
  ) as HTMLCanvasElement;

  const rasterContext: WebGL2RenderingContext =
    rasterCanvas.getContext("webgl2");
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

  let rasterCamera = {
    eye: new Vector(0, 0, 1, 1),
    center: new Vector(0, 0, 0, 1),
    up: new Vector(0, 1, 0, 0),
    fovy: 48,
    aspect: rasterCanvas.width / rasterCanvas.height,
    near: 0.1,
    far: 100,
  };
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
  let rayVisitor = new RayVisitor(
    rayContext,
    rayCanvas.width,
    rayCanvas.height,
    phongValues
  );

  modeToggleForm.addEventListener("change", (event: Event) => {
    const input = event.target as HTMLInputElement;
    mode = input.value;

    console.log("Mode toggled: " + mode);

    if (mode === "rasterization") {
      rayCanvas.style.display = "none";
      rasterCanvas.style.display = "block";
    } else {
      rasterCanvas.style.display = "none";
      rayCanvas.style.display = "block";
    }
  });

  const lightPositions = [new Vector(1, 1, -1, 1)];
  const camera = {
    origin: new Vector(0, 0, 0, 1),
    width: rayCanvas.width,
    height: rayCanvas.height,
    alpha: Math.PI / 3,
  };

  window.requestAnimationFrame(animate);

  //tastatur eingaben
  /////////////////////////////////////////////////////////////////////////////////////////////////////
  let translationX = 0;
  let translationY = 0;
  let translationZ = 0;
  let rotationAngleX = 0;
  let rotationAngleY = 0;
  let rotationAngleZ = 0;
  let scaleX = 1;
  let scaleY = 1;
  let scaleZ = 1;

  let translationSize = 0.2;
  let scaleSize = 0.1;
  let rotationAmount = 30;

  function animate() {
    //könnte man mit dem Objekt parametrisieren damit das für jedes Objekt geht langfristig --> in andere Klasse auslagern?
    gnTranslation.translationVector = new Vector(
      translationX,
      translationY,
      translationZ,
      0
    );
    gnRotationX.angle = rotationAngleX;
    gnRotationY.angle = rotationAngleY;
    gnRotationZ.angle = rotationAngleZ;
    gnScaling.scale = new Vector(scaleX, scaleY, scaleZ, 0);
    rasterVisitor.render(sg, rasterCamera, []);
    rayVisitor = new RayVisitor(
      rayContext,
      rayCanvas.width,
      rayCanvas.height,
      phongValues
    );
    rayVisitor.render(sg, camera, lightPositions);
  }

  window.addEventListener("keydown", function (event) {
    switch (event.key) {
      case "w": //hoch
        translationY += translationSize;
        break;
      case "a": //runter
        translationX -= translationSize;
        break;
      case "s": //links
        translationY -= translationSize;
        break;
      case "d": //rechts
        translationX += translationSize;
        break;
      case "e": //vor
        translationZ += translationSize;
        break;
      case "q": //zurück
        translationZ -= translationSize;
        break;
      case "x": //um x achse rotieren, muss noch die achse einstellen können
        rotationAngleX += rotationAmount;
        break;
      case "y": //um y achse rotieren
        rotationAngleY += rotationAmount;
        break;
      case "c": //um z achse rotieren, muss noch die negativ richtung gemacht werden?
        rotationAngleZ += rotationAmount;
        break;
      case "r": //X skalieren größer
        scaleX += scaleSize;
        break;
      case "f": //Y skalieren größer
        scaleY += scaleSize;
        break;
      case "v": //Z skalieren größer
        scaleZ += scaleSize;
        break;
      case "t": //X skalieren kleiner
        scaleX -= scaleSize;
        break;
      case "g": //Y skalieren kleiner
        scaleY -= scaleSize;
        break;
      case "b": //Z skalieren kleiner
        scaleZ -= scaleSize;
        break;
    }
    window.requestAnimationFrame(animate);
  });

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
});

//TODO
//rotation fixen
//performacne optimieren
