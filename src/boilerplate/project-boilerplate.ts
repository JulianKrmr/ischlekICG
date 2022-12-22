import 'bootstrap';
import 'bootstrap/scss/bootstrap.scss';
import Vector from "../math/vector";
import Matrix from "../math/matrix";
import Sphere from "../objects/sphere";
import Ray from "../math/ray";
import phong from "../phong";
import {AABoxNode, GroupNode, PyramidNode, SphereNode} from "../nodes";
import {Rotation, Scaling, Translation} from "../math/transformation";
import RayVisitor from "../raytracing/rayvisitor";
import RasterBox from "../objects/raster-box";
import {RasterVisitor} from "../rasterisation/rastervisitor";

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
            //ist nicht der default mode aber der Hintergrund ist trotzdem noch weis am anfang
        }
    });

    //scene graph
    ////////////////////////////////////////////////////////////////////////////////////////////////
    const sg = new GroupNode(new Translation(new Vector(0, 0, -5, 0)));

    let gnTranslation = new Translation(new Vector(0,0,0,0));
    let gnRotation = new Rotation(new Vector(0,0,0,0), 0);
    let gnScaling = new Scaling(new Vector(1,1,1,0));

    const gn1 = new GroupNode(gnTranslation);
    const gn2 = new GroupNode(gnRotation);
    const gn3 = new GroupNode(gnScaling);

    sg.add(gn1);
    gn1.add(gn2);
    gn2.add(gn3);

    gn3.add(new SphereNode(new Vector(0.5,0,0,0)));
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



    let rotation = Matrix.identity();
    let translation = Matrix.identity();
    let scale = Matrix.identity();

    //TODO muss raus und alles wo animate drinn steht
    function animate() {
        data.fill(0);
        let matrix = Matrix.identity();
        if (useRotationElement.checked) {
            matrix = matrix.mul(rotation);
        }
        if (useTranslationElement.checked) {
            matrix = matrix.mul(translation);
        }
        if (useScaleElement.checked) {
            matrix = matrix.mul(scale);
        }
        const sphere = new Sphere(matrix.mulVec(new Vector(0.1, 0, -1.5, 1)), 0.4, new Vector(.3, 0, 0, 1));

        ctx.putImageData(imageData, 0, 0);
    }
    //window.requestAnimationFrame(animate);

    const useRotationElement = document.getElementById("userotation") as HTMLInputElement;
    useRotationElement.onchange = () => {
        let range = document.getElementById("rotation") as HTMLInputElement;
        if (useRotationElement.checked) {
            range.value = "0";
            range.oninput = () => {
                rotation = Matrix.rotation(new Vector(0, 0, 1, 0),
                    Number(range.value));
                //window.requestAnimationFrame(animate);
            }
            range.disabled = false;
            range.oninput(new Event("click"));
        } else {
            range.disabled = true;
            rotation = Matrix.identity();
        }
       // window.requestAnimationFrame(animate);
    }

    const useTranslationElement = document.getElementById("usetranslation") as HTMLInputElement;
    useTranslationElement.onchange = () => {
        let range = document.getElementById("translation") as HTMLInputElement;
        if (useTranslationElement.checked) {
            range.value = "0";
            range.oninput = () => {
                translation = Matrix.translation(new Vector(Number(range.value), 0, 0, 0));
                window.requestAnimationFrame(animate);
            }
            range.disabled = false;
            range.oninput(new Event("click"));
        } else {
            range.disabled = true;
            translation = Matrix.identity();
        }
        window.requestAnimationFrame(animate);
    }

    const useScaleElement = document.getElementById("usescale") as HTMLInputElement;
    useScaleElement.onchange = () => {
        let range = document.getElementById("scale") as HTMLInputElement;
        if (useScaleElement.checked) {
            range.value = "1";
            range.oninput = () => {
                scale = Matrix.scaling(new Vector(
                    Number(range.value),
                    Number(range.value),
                    Number(range.value), 0));
                window.requestAnimationFrame(animate);
            }
            range.disabled = false;
            range.oninput(new Event("click"));
        } else {
            range.disabled = true;
            scale = Matrix.identity();
        }
        window.requestAnimationFrame(animate);
    }

    const sliders = ["rotation", "translation", "scale"];
    for (let t of sliders) {
        const elem = document.getElementById("use" + t) as HTMLInputElement;
        if (elem.checked) {
            elem.onchange(new Event("click"));
        }
    }


    //tastatur eingaben
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    let translationX = 0;
    let translationY = 0;
    let translationZ = 0;

    let translationSize = 0.02;
    let scaleSize = 0.1;
    let rotationAmount = 0.1;

    function animatePosition(){
        //TODO die rotation und das scaling
        gnTranslation.translationVector = new Vector(translationX, translationY, translationZ, 0);
        visitor.render(sg, camera, lightPositions);
    }
    window.requestAnimationFrame(animatePosition);


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
                translation = Matrix.translation(new Vector(0, 0, translationSize, 0)).mul(translation);
                break;
            case "q": //zurück
                translation = Matrix.translation(new Vector(0, 0, -translationSize, 0)).mul(translation);
                break;
            case "x": //geht nicht, um x achse rotieren
                break;
            case "y": //geht nicht, um y achse rotieren
                break;
            case "c": //um z achse rotieren
                break;
            case "r": //größer skalieren
                scale = Matrix.scaling(new Vector(1-scaleSize, 1-scaleSize, 1-scaleSize, 0)).mul(scale);
                break;
            case "f": //kleiner skalieren
                scale = Matrix.scaling(new Vector(1+scaleSize, 1+scaleSize, 1+scaleSize, 0)).mul(scale);
                break;
        }
        window.requestAnimationFrame(animatePosition);
    });
});