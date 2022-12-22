import 'bootstrap';
import 'bootstrap/scss/bootstrap.scss';
import Vector from "../math/vector";
import {AABoxNode, GroupNode, PyramidNode, SphereNode} from "../nodes";
import {Rotation, Scaling, Translation} from "../math/transformation";
import RayVisitor from "../raytracing/rayvisitor";
import {RasterSetupVisitor, RasterVisitor} from "../rasterisation/rastervisitor";
import Shader from "../shader/shader";
import vertexShader from "../shader/basic-vertex-shader.glsl";
import fragmentShader from "../shader/basic-fragment-shader.glsl";

window.addEventListener('load', () => {
    const canvas = document.getElementById("scene--canvas") as HTMLCanvasElement;
    const modeToggleForm = document.getElementById("mode--toggle") as HTMLFormElement;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let visitor = new RayVisitor(ctx, canvas.width, canvas.height); //der default ist raytracing

    modeToggleForm.addEventListener("change", (event: Event) => {
        const input = event.target as HTMLInputElement;
        const mode = input.value;
        console.log("Mode toggled: " + mode)
        if(mode === "rasterization"){
            canvas.style.backgroundColor = "black";
            visitor = new RayVisitor(ctx, canvas.width, canvas.height);
            //TODO das ist quatsch, muss noch zu Raster visitor gemacht werden
        } else {
            canvas.style.backgroundColor = "white";
           visitor = new RayVisitor(ctx, canvas.width, canvas.height);
            // ist nicht der default mode aber der Hintergrund ist trotzdem noch weis am anfang
        }
    });

    //scene graph
    ////////////////////////////////////////////////////////////////////////////////////////////////
    const sg = new GroupNode(new Translation(new Vector(0, 0, -5, 0)));

    let gnTranslation = new Translation(new Vector(0,0,0,0));
    let gnRotationX = new Rotation(new Vector(1,0,0,0), 0);
    let gnRotationY = new Rotation(new Vector(0,1,0,0), 0);
    let gnRotationZ = new Rotation(new Vector(0,0,1,0), 0);
    let gnScaling = new Scaling(new Vector(1,1,1,0));

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

    gn5.add(new AABoxNode(new Vector(0.5,0,0,0)));
    ///////////////////////////////////////////////////////////////////////////////////////////////

    const lightPositions = [
        new Vector(1, 1, -1, 1)
    ];
    const shininess = 10;
    const camera = {
        origin: new Vector(0, 0, 0, 1),
        width: canvas.width,
        height: canvas.height,
        alpha: Math.PI / 3
    }

    window.requestAnimationFrame(animatePosition);


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

    function animatePosition() {
        gnTranslation.translationVector = new Vector(translationX, translationY, translationZ, 0);
        gnRotationX.angle = rotationAngleX;
        gnRotationY.angle = rotationAngleY;
        gnRotationZ.angle = rotationAngleZ;
        gnScaling.scale = new Vector(scaleX, scaleY, scaleZ,0);

       visitor.render(sg, camera, lightPositions);
    }

    window.addEventListener('keydown', function (event) {
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
                translationZ += translationSize;
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
        window.requestAnimationFrame(animatePosition);
    });
});

//TODO
//phong einbinden
//rastervisitor rein nehmen
//rotation fixen
//performacne optimieren