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
  TexturePyramidNode,
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
import { DriverNode, JumperNode, RotationNode, ScalerNode, AnimationNode } from "../raytracing/animation-nodes";
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
const thickness = 0.1;

window.addEventListener("load", () => {
  const modeToggleForm = document.getElementById("mode--toggle") as HTMLFormElement;

  //This is the node that can be moved through key commands
  //null in the beginning, changes on click
  let selectedNode:
    | SphereNode
    | PyramidNode
    | AABoxNode
    | CustomShapeNode
    | TextureVideoBoxNode
    | TextureTextBoxNode
    | TextureBoxNode
    | TexturePyramidNode = null;
  let selectedGroupNode: GroupNode = null;

  //scene graph
  ///////////////////////////////////////////////////////////////////////////////////////////////
  let nodes: any[] = [];

  let sg = new GroupNode(new Translation(new Vector(0, 0, -15, 0)));

  // camera
  const camera1 = new CameraNode();
  const cameraTranslation = new GroupNode(new Translation(new Vector(0, -1, 12, 0)));
  cameraTranslation.add(camera1);
  sg.add(cameraTranslation);

  // creates light with lightbulb (yellow SphereNode) and toggles its jumper nodes activation
  function createLight(translationVector: Vector, bulbColor: Vector, movementVector: Vector) {
    const light = new LightNode();
    const lightTranslation = new GroupNode(new Translation(translationVector), 12345);
    const bulbScaling = new GroupNode(new Scaling(new Vector(0.5, 0.5, 0.5, 1)));
    const lightJump = new JumperNode(lightTranslation, movementVector, 0.001, false);
    const bulb = new SphereNode(bulbColor, lightTranslation);
    bulbScaling.add(bulb);
    lightTranslation.add(light);
    lightTranslation.add(bulbScaling);
    sg.add(lightTranslation);
    lightJump.toggleActive();
    return lightJump;
  }

  // create 4 specific lights for the scene and add to lights array for clean functional .simulate calls
  const light1 = createLight(new Vector(-3, -2, 4, 0), new Vector(1, 1, 0, 1), new Vector(0, 5, 0, 0));
  const light2 = createLight(new Vector(-3, 3, 4, 0), new Vector(1, 1, 0, 1), new Vector(7, 0, 0, 0));
  const light3 = createLight(new Vector(5, -3, -3, 0), new Vector(1, 1, 0, 1), new Vector(0, 0, 7, 0));
  const light4 = createLight(new Vector(5, 0, 40, 0), new Vector(1, 1, 0, 1), new Vector(-10, 0, 0, 0));

  const lights = [light1, light2, light3, light4];

  // create window including name, top bar and bottom bar
  const createWindow = (xTranslation: number, idMini: number, idMaxi: number, windowNaming: string) => {
    // first the window itself, sg x tranlation x scaling x window
    // windowTranslation is the window parent so click can be determined by it
    const windowScaling = new GroupNode(new Scaling(new Vector(5, 5.25, thickness, 0)));
    const windowTranslation = new GroupNode(new Translation(new Vector(xTranslation, 0.5, 0, 0)));
    const window = new AABoxNode(new Vector(0.4, 0.3, 0.0, 1), windowTranslation);
    windowScaling.add(window);
    windowTranslation.add(windowScaling);
    sg.add(windowTranslation);

    // adding top bars for windows
    const windowTopBarScaling = new GroupNode(new Scaling(new Vector(2, 0.5, thickness, 0)));
    const windowTopBarTranslation = new GroupNode(new Translation(new Vector(0.5, 2.9, 0, 0)));
    const windowTopBar = new AABoxNode(new Vector(0.7, 0.1, 0, 1), windowTranslation);
    const windowNameScaling = new GroupNode(new Scaling(new Vector(2, 0.5, thickness, 0)));
    const windowNameTranslation = new GroupNode(new Translation(new Vector(-1.49, 2.9, 0, 0)));
    const windowNameRotation = new GroupNode(new Rotation(new Vector(0, 0, 1, 0), Math.PI));

    // adds window name
    const windowName = new TextureTextBoxNode(windowNaming, windowTranslation);

    windowNameRotation.add(windowName);
    windowNameScaling.add(windowNameRotation);
    windowNameTranslation.add(windowNameScaling);
    windowTranslation.add(windowNameTranslation);

    windowTopBarScaling.add(windowTopBar);
    windowTopBarTranslation.add(windowTopBarScaling);
    windowTranslation.add(windowTopBarTranslation);

    //adds window minimizer to topBar
    const minimizerTranslation = new GroupNode(new Translation(new Vector(2.25, 2.9, 0, 0)));
    const minimizerScaling = new GroupNode(new Scaling(new Vector(0.5, 0.5, thickness, 0)), idMini);
    const minimizer = new AABoxNode(new Vector(0.3, 0.1, 1, 1), minimizerScaling);

    minimizerScaling.add(minimizer);
    minimizerTranslation.add(minimizerScaling);
    windowTranslation.add(minimizerTranslation);

    //adds window maximizer to topBar
    const maximizerTranslation = new GroupNode(new Translation(new Vector(1.75, 2.9, 0, 0)));
    const maximizerScaling = new GroupNode(new Scaling(new Vector(0.5, 0.5, thickness, 0)), idMaxi);
    const maximizer = new AABoxNode(new Vector(0.7, 0.3, 0.3, 1), maximizerScaling);

    maximizerScaling.add(maximizer);
    maximizerTranslation.add(maximizerScaling);
    windowTranslation.add(maximizerTranslation);

    // adds a white blank scene for nicer styling into the window
    const windowSceneScaling = new GroupNode(new Scaling(new Vector(4.5, 4.7, thickness, 0)));
    const windowSceneTranslation = new GroupNode(new Translation(new Vector(0, 0, 0.01, 0)));
    const windowScene = new AABoxNode(new Vector(0.9, 0.9, 0.9, 1), windowTranslation);
    windowSceneScaling.add(windowScene);
    windowSceneTranslation.add(windowSceneScaling);
    windowTranslation.add(windowSceneTranslation);

    return windowTranslation;
  };

  // create 2 specific windows with id for click recognition and x translation values
  const leftWindowSceneTranslation = createWindow(-2.8, 1, 3, "Left");
  const rightWindowSceneTranslation = createWindow(2.8, 2, 4, "Right");
  // add some geometry to first window
  const pyramidScaling = new GroupNode(new Scaling(new Vector(0.5, 0.5, 0.5, 0)));
  const pyramidTranslation = new GroupNode(new Translation(new Vector(-1, -2, 1, 0)));
  const pyramid = new TexturePyramidNode("hci-logo.png", pyramidScaling);
  pyramidScaling.add(pyramid);
  pyramidTranslation.add(pyramidScaling);
  leftWindowSceneTranslation.add(pyramidTranslation);

  const sphereScaling = new GroupNode(new Scaling(new Vector(0.3, 0.3, 0.3, 0)));
  const sphereTranslation = new GroupNode(new Translation(new Vector(0, -0.5, 1, 0)));
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

  // video
  const textureBoxScaling = new GroupNode(new Scaling(new Vector(4.0, 2.0, 0.1, 0)));
  const textureBoxTranslation = new GroupNode(new Translation(new Vector(0.1, 1, 0.02, 0)));
  const textureBox = new TextureVideoBoxNode("schalke.mp4", textureBoxScaling);

  const textureBoxRotation = new GroupNode(new Rotation(new Vector(0, 0, 1, 0), Math.PI));

  textureBoxRotation.add(textureBox);
  textureBoxScaling.add(textureBoxRotation);
  textureBoxTranslation.add(textureBoxScaling);
  leftWindowSceneTranslation.add(textureBoxTranslation);

  // taskbar icons
  const createTaskbarIcon = (xPos: number, id: number, color: Vector) => {
    const taskbarIconTranslation = new GroupNode(new Translation(new Vector(xPos, 0.01, 0, 0)), id);
    const taskbarIconScaling = new GroupNode(new Scaling(new Vector(1, 1, 1.1, 0)));
    const taskbarIcon = new AABoxNode(color, taskbarIconTranslation);
    taskbarIconScaling.add(taskbarIcon);
    taskbarIconTranslation.add(taskbarIconScaling);
    return taskbarIconTranslation;
  };

  const createTexturedTaskbarIcon = (xPos: number, id: number, texture: string) => {
    const taskbarIconTranslation = new GroupNode(new Translation(new Vector(xPos, 0.01, 0, 0)), id);
    const taskbarIconScaling = new GroupNode(new Scaling(new Vector(1, 1, 1.1, 0)));
    const taskbarIcon = new TextureBoxNode(texture, taskbarIconTranslation, "brickwall-normal.jpg");
    taskbarIconScaling.add(taskbarIcon);
    taskbarIconTranslation.add(taskbarIconScaling);
    return taskbarIconTranslation;
  };

  // taskbar
  const taskbarScaling = new GroupNode(new Scaling(new Vector(15, 1, 1, 0)), 12345);
  const taskbarTranslation = new GroupNode(new Translation(new Vector(0, -4, 0, 0)));
  const taskbar = new AABoxNode(new Vector(0.5, 0.5, 0.5, 1), taskbarScaling);
  taskbarScaling.add(taskbar);
  taskbarTranslation.add(taskbarScaling);
  sg.add(taskbarTranslation);

  // create specific taskbar icons with id for click recognition and x translation
  const leftTaskbarIcon = createTaskbarIcon(-3.5, 10, new Vector(0.5, 0.1, 0.3, 1));
  taskbarTranslation.add(leftTaskbarIcon);

  const rightTaskbarIcon = createTaskbarIcon(-2.2, 11, new Vector(0.1, 0.5, 0.3, 1));
  taskbarTranslation.add(rightTaskbarIcon);

  const animationTaskBarIcon = createTaskbarIcon(0.9, 12, new Vector(0.1, 0.3, 1, 1));
  taskbarTranslation.add(animationTaskBarIcon);

  const textureTaskbarIcon = createTexturedTaskbarIcon(-0.9, 12, "hci-logo.png");
  taskbarTranslation.add(textureTaskbarIcon);

  //TicTacToe
  const ticTacToeRoot = new GroupNode(new Translation(new Vector(-1, -1, 0.2, 0)));
  ticTacToeRoot.add(createTicTacToe());

  //creates the tic tac toe board, returns the group node
  function createTicTacToe() {
    const ticTacToeScaling = new GroupNode(new Scaling(new Vector(0.8, 0.8, thickness, 0))); //scales the size of the cubes
    //attaches the cubes to the scale node, who is attached to the root node
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let cubetranslation = new GroupNode(new Translation(new Vector(i * 1.3, j * 1.3, 0, 0)), i + j * 3 + 20); //ids go from 20 to 28
        let cube = new TextureTextBoxNode(" ", cubetranslation);
        cubetranslation.add(cube);
        ticTacToeScaling.add(cubetranslation);
      }
    }
    return ticTacToeScaling;
  }

  rightWindowSceneTranslation.add(ticTacToeRoot);

  const backgroundScaling = new GroupNode(new Scaling(new Vector(200, 200, thickness, 0)), 12345);
  const backgroundTranslation = new GroupNode(new Translation(new Vector(0, 0, -50, 0)));
  const background = new AABoxNode(new Vector(0.1, 0.1, 0.1, 1), backgroundScaling);
  backgroundScaling.add(background);
  backgroundTranslation.add(backgroundScaling);
  sg.add(backgroundTranslation);

  ///////////////////////////////////////////////////////////////////////////////////////////////
  //Animation Nodes
  let animation1 = new DriverNode(selectedGroupNode, new Vector(0, -5, -30, 0), 0.0002);
  let minimizeScaling = new ScalerNode(selectedGroupNode, new Vector(0.1, 0.1, 0.1, 0), true, 0.0002);
  let animationZoom = new DriverNode(selectedGroupNode, new Vector(0, 0, -30, 0), 0.0002);
  let cubeScalingAnimation = new ScalerNode(selectedGroupNode, new Vector(0.1, 0.1, 0.1, 0), true, 0.0002);
  let cubeTranslationAnimation = new DriverNode(selectedGroupNode, new Vector(0, 0, -30, 0), 0.0002);
  let cubeRotationAnimation = new RotationNode(selectedGroupNode, new Vector(0, 1, 0, 0));

  let rotationSphere = new RotationNode(aaboxScaling, new Vector(1, 0, 0, 0));
  rotationSphere.toggleActive();

  let rotationPyramid = new RotationNode(pyramidScaling, new Vector(0, 1, 0, 0), 0.0003);
  rotationPyramid.toggleActive();

  ///////////////////////////////////////////////////////////////////////////////////////////////
  //rasterizer setup
  const rasterCanvas = document.getElementById("raster-canvas") as HTMLCanvasElement;

  const rasterContext: WebGL2RenderingContext = rasterCanvas.getContext("webgl2");
  const setupVisitor = new RasterSetupVisitor(rasterContext);
  setupVisitor.setup(sg);

  const phongShader = new Shader(rasterContext, phongVertexPerspectiveShader, phongFragmentShader);

  const textureShader = new Shader(rasterContext, textureVertexShader, textureFragmentShader);

  const rasterVisitor = new RasterVisitor(rasterContext, phongShader, textureShader, setupVisitor.objects);

  phongShader.load();
  textureShader.load();

  //ray tracer setup
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

  // animates the scene every frame
  let lastTimestamp = performance.now();
  window.requestAnimationFrame(animate);

  function animate(timestamp: number) {
    if (renderMode == "rasterization") {
      rasterVisitor.renderWithPhong(sg, phongValues);
    } else if (renderMode == "raytracing") {
      rayVisitor.render(sg, null, null, phongValues);
    }

    animation1.simulate(timestamp - lastTimestamp);
    rotationSphere.simulate(timestamp - lastTimestamp);
    rotationPyramid.simulate(timestamp - lastTimestamp);
    minimizeScaling.simulate(timestamp - lastTimestamp);
    animationZoom.simulate(timestamp - lastTimestamp);
    cubeScalingAnimation.simulate(timestamp - lastTimestamp);
    cubeTranslationAnimation.simulate(timestamp - lastTimestamp);
    cubeRotationAnimation.simulate(timestamp - lastTimestamp);
    lights.forEach((light) => light.simulate(timestamp - lastTimestamp));

    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
  }

  //tastatur eingaben
  /////////////////////////////////////////////////////////////////////////////////////////////////////

  let animationAllowed = true;
  let time = 1000;

  let translationSize = 5;
  let scaleSize = 2;

  window.addEventListener("keydown", function (event) {
    if (animationAllowed) {
      switch (event.key) {
        case "w": //hoch
          cubeTranslationAnimation = new DriverNode(animationTaskBarIcon, new Vector(0, translationSize, 0, 0), 0.0002);
          cubeTranslationAnimation.toggleActive();
          animationAllowed = false;
          //activate the animation for 2 seconds
          setTimeout(function () {
            cubeTranslationAnimation.toggleActive();
            animationAllowed = true;
          }, time);

          break;
        case "s": //runter
          cubeTranslationAnimation = new DriverNode(animationTaskBarIcon, new Vector(0, -translationSize, 0, 0), 0.0002);
          cubeTranslationAnimation.toggleActive();
          animationAllowed = false;
          //activate the animation for 2 seconds
          setTimeout(function () {
            cubeTranslationAnimation.toggleActive();
            animationAllowed = true;
          }, time);
          break;
        case "a": //links
          cubeTranslationAnimation = new DriverNode(animationTaskBarIcon, new Vector(-translationSize, 0, 0, 0), 0.0002);
          cubeTranslationAnimation.toggleActive();
          animationAllowed = false;
          //activate the animation for 2 seconds
          setTimeout(function () {
            cubeTranslationAnimation.toggleActive();
            animationAllowed = true;
          }, time);
          break;
        case "d": //rechts
          cubeTranslationAnimation = new DriverNode(animationTaskBarIcon, new Vector(translationSize, 0, 0, 0), 0.0002);
          cubeTranslationAnimation.toggleActive();
          animationAllowed = false;
          //activate the animation for 2 seconds
          setTimeout(function () {
            cubeTranslationAnimation.toggleActive();
            animationAllowed = true;
          }, time);
          break;
        case "e": //vor
          cubeTranslationAnimation = new DriverNode(animationTaskBarIcon, new Vector(0, 0, translationSize, 0), 0.0002);
          cubeTranslationAnimation.toggleActive();
          animationAllowed = false;
          //activate the animation for 2 seconds
          setTimeout(function () {
            cubeTranslationAnimation.toggleActive();
            animationAllowed = true;
          }, time);
          break;
        case "q": //zurück
          cubeTranslationAnimation = new DriverNode(animationTaskBarIcon, new Vector(0, 0, -translationSize, 0), 0.0002);
          cubeTranslationAnimation.toggleActive();
          animationAllowed = false;
          //activate the animation for 2 seconds
          setTimeout(function () {
            cubeTranslationAnimation.toggleActive();
            animationAllowed = true;
          }, time);
          break;
        case "x": //um x achse rotieren
          cubeRotationAnimation = new RotationNode(animationTaskBarIcon, new Vector(1, 0, 0, 0));
          cubeRotationAnimation.toggleActive();
          animationAllowed = false;
          //activate the animation for 2 seconds
          setTimeout(function () {
            cubeRotationAnimation.toggleActive();
            animationAllowed = true;
          }, time);
          break;
        case "y": //um y achse rotieren
          cubeRotationAnimation = new RotationNode(animationTaskBarIcon, new Vector(0, 1, 0, 0));
          cubeRotationAnimation.toggleActive();
          animationAllowed = false;
          //activate the animation for 2 seconds
          setTimeout(function () {
            cubeRotationAnimation.toggleActive();
            animationAllowed = true;
          }, time);
          break;
        case "c": //um z achse rotieren
          cubeRotationAnimation = new RotationNode(animationTaskBarIcon, new Vector(0, 0, 1, 0));
          cubeRotationAnimation.toggleActive();
          animationAllowed = false;
          //activate the animation for 2 seconds
          setTimeout(function () {
            cubeRotationAnimation.toggleActive();
            animationAllowed = true;
          }, time);
          break;
        case "r": //Skalieren größer
          cubeScalingAnimation = new ScalerNode(animationTaskBarIcon, new Vector(scaleSize, scaleSize, scaleSize, 0));
          cubeScalingAnimation.toggleActive();
          animationAllowed = false;
          //activate the animation for 2 seconds
          setTimeout(function () {
            cubeScalingAnimation.toggleActive();
            animationAllowed = true;
          }, time);
          break;
        case "t": //Skalieren größer
          cubeScalingAnimation = new ScalerNode(animationTaskBarIcon, new Vector(0.5, 0.5, 0.5, 0));
          cubeScalingAnimation.toggleActive();
          animationAllowed = false;
          //activate the animation for 2 seconds
          setTimeout(function () {
            cubeScalingAnimation.toggleActive();
            animationAllowed = true;
          }, time);
          break;
      }
    }
  });

  //control sliders
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

  // mouse click listener, actions according to the id of the clicked node
  rasterCanvas.addEventListener("click", (event) => {
    if (canClick) {
      let mx = event.offsetX;
      let my = event.offsetY;
      selectedNode = mouseRayVisitor.click(sg, mx, my, rasterContext);
      if (selectedNode != null) {
        selectedGroupNode = selectedNode.parent;
        checkactions();
      }
    }
  });

  // mouse click listener, actions according to the id of the clicked node
  rayCanvas.addEventListener("click", (event) => {
    if (canClick) {
      let mx = event.offsetX;
      let my = event.offsetY;
      selectedNode = mouseRayVisitor.click(sg, mx, my, rayContext);
      if (selectedNode != null) {
        selectedGroupNode = selectedNode.parent;
        checkactions();
      }
    }
  });

  //all actions available due to the id of the clicked node
  let maximisedLeft = true;
  let maximisedRight = true;
  let currentPlayerOne = true;
  function checkactions() {
    if (!ctrlDown) {
      if (selectedGroupNode.id == null) {
        //jumps once
        animation1 = new JumperNode(selectedGroupNode, new Vector(0, 0.5, 0, 0), 0.005, true);
        animation1.toggleActive();
        //if left minimize btn is selected, animate the minimization
      } else if (selectedGroupNode.id == 1 && maximisedLeft) {
        animation1 = new DriverNode(leftWindowSceneTranslation, new Vector(-2, -14, 0, 0), 0.001);
        maximisedLeft = false;
        animation1.toggleActive();
        if (zoomedIn) {
          zoom(167, 291);
        }
      }
      //if right minimize btn is selected, animate the minimization
      else if (selectedGroupNode.id == 2 && maximisedRight) {
        animation1 = new DriverNode(rightWindowSceneTranslation, new Vector(-6, -14, 0, 0), 0.001);
        maximisedRight = false;
        animation1.toggleActive();
        if (zoomedIn) {
          zoom(840, 287);
        }
      }
      //the left maximizer
      else if (selectedGroupNode.id == 3) {
        zoom(167, 291);
      }
      //the right maximizer
      else if (selectedGroupNode.id == 4) {
        zoom(840, 287);
      }
      //if left maximize btn is selected, animate the maximization
      else if (selectedGroupNode.id == 10 && !maximisedLeft) {
        animation1 = new DriverNode(leftWindowSceneTranslation, new Vector(2, 14, 0, 0), 0.001);
        maximisedLeft = true;
        animation1.toggleActive();
        //if right maximize btn is selected, animate the maximization
      } else if (selectedGroupNode.id == 11 && !maximisedRight) {
        animation1 = new DriverNode(rightWindowSceneTranslation, new Vector(6, 14, 0, 0), 0.001);
        maximisedRight = true;
        animation1.toggleActive();
      } else if (selectedGroupNode.id >= 20 && selectedGroupNode.id <= 28) {
        //covers all tictactoe cubes
        toggleSymbol(currentPlayerOne);
        currentPlayerOne = !currentPlayerOne;
        //little click animation
        animation1 = new JumperNode(selectedGroupNode, new Vector(0, 0, 0.3, 0), 0.005, true);
        animation1.toggleActive();
      }
    }
  }

  //toggles the symbol of the tic tac toe cubes
  function toggleSymbol(currentPlayer: boolean) {
    //switch between 3 otpions X, O, empty
    if (currentPlayer) {
      if (selectedNode instanceof TextureTextBoxNode) {
        if (selectedNode.texture == "X") {
          selectedNode.texture = "O";
          setupVisitor.setup(sg);
        } else if (selectedNode.texture == "O") {
          selectedNode.texture = "";
          setupVisitor.setup(sg);
        } else {
          selectedNode.texture = "X";
          setupVisitor.setup(sg);
        }
      }
    } else {
      if (selectedNode instanceof TextureTextBoxNode) {
        if (selectedNode.texture == "X") {
          selectedNode.texture = "O";
          setupVisitor.setup(sg);
        } else if (selectedNode.texture == "O") {
          selectedNode.texture = "";
          setupVisitor.setup(sg);
        } else {
          selectedNode.texture = "O";
          setupVisitor.setup(sg);
        }
      }
    }
  }

  //reset button for the tic tac toe game
  let resetGameButton = document.getElementById("resetTicTacToe");
  resetGameButton.onclick = () => {
    ticTacToeRoot.children = [];
    const newTicTacToe = new GroupNode(new Translation(new Vector(-1, -1, 0.2, 0)));
    newTicTacToe.add(createTicTacToe());
    rightWindowSceneTranslation.add(newTicTacToe);
    setupVisitor.setup(sg);
  };

  let zoomedIn = false;
  let zoomVector = new Vector(0, 0, 0, 0);

  //aktivates the listener for the shift key
  var ctrlDown = false;
  document.addEventListener("keydown", function (event) {
    if (event.key === "Shift") {
      ctrlDown = true;
    }
  });
  document.addEventListener("keyup", function (event) {
    if (event.key === "Shift") {
      ctrlDown = false;
    }
  });

  //zoom in and out to the clicked point
  document.addEventListener("click", function (event) {
    if (canClick) {
      if (ctrlDown) {
        let mx = event.offsetX;
        let my = event.offsetY;
        console.log(mx);
        console.log(my);
        zoom(mx, my);
      }
    }
  });

  function zoom(mx: number, my: number) {
    if (!zoomedIn) {
      let ray = mouseRayVisitor.CameraDrive(sg, mx, my, rasterContext);
      zoomVector = ray.direction.mul(7);
      animationZoom = new DriverNode(cameraTranslation, zoomVector, 0.002);
    } else {
      animationZoom = new DriverNode(cameraTranslation, zoomVector.mul(-1), 0.002);
    }
    animationZoom.toggleActive();
    zoomedIn = !zoomedIn;
  }

  //adds a small timeout to the click event to prevent double clicks (and therefore double actions)
  var canClick = true;
  document.addEventListener("click", function (event) {
    if (canClick) {
      // Only executes when canClick is true
      // Set canClick to false and start the timeout
      canClick = false;
      setTimeout(function () {
        canClick = true;
      }, 400); // Set the timeout to 400ms
    }
  });

  // download and import scene as JSON
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

//functions to rotate, translate and scale a node, also used in animationNodes
//multiply the old matrix with the new matrix to get the new matrix, changes the group node matrix
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
