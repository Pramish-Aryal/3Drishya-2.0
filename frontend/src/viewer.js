import * as Three from 'three';

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';



const loader = new GLTFLoader();

let canvas = document.querySelector('#viewer-canvas');
let renderer = new Three.WebGLRenderer({ canvas: canvas, antialias: true });

const scene = new Three.Scene();
const camera = new Three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const light = new Three.AmbientLight(0xffffff); // soft white light
scene.add(light);

camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);

const clock = new Three.Clock();

let sceneName = null
let addedSplats = [] // path array of splats
let splatsToAdd = []
let addedObjs = [] // path array of objects

//object-info
let objectInfo = document.getElementById("object-info")
let userDataContent = document.getElementById("userDataContent");
let userDataTitle = document.getElementById("userDataTitle");
let closeButton = document.getElementById("close-button");

//text-renderer
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none'
document.body.appendChild(labelRenderer.domElement);

const labelDiv = document.createElement('div');
labelDiv.className = 'label';
const labelObject = new CSS2DObject(labelDiv);
labelObject.visible = false
const mouse = new Three.Vector2();
let raycaster = new Three.Raycaster();

canvas.addEventListener('mousemove', onDocumentMouseMove, false);
canvas.addEventListener('click', onDocumentMouseClick, false)

let viewer = new GaussianSplats3D.DropInViewer({
    'gpuAcceleratedSort': true,
    'sharedMemoryForWorkers': false,
    'dynamicScene': true
});

scene.add(viewer)
window.scene = scene
const popLength = scene.children.length;


const mouse_controls = new OrbitControls(camera, renderer.domElement);
mouse_controls.enableDamping = true;
mouse_controls.enablePan = true;
mouse_controls.enableZoom = true;

const cubes = [] // [ create_cube(new Vector3(1, 0, 0), new Vector3(2, 3, 1), 0xff00ff), create_cube()];


function get_url_param(key) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(key)
}





function gotoeditor(sceneName) {
    window.location.href = `editor.html?scene=${sceneName}`;
}

const gotoEditorButton = document.getElementById('gotoEditorButton');
if (gotoEditorButton) {
    gotoEditorButton.addEventListener('click', function () {
        gotoeditor(sceneName);
    });
}



function onDocumentMouseMove(event) {

    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

}

function onDocumentMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // calculate objects intersecting the picking ray
    let intersects = raycaster.intersectObjects(scene.children, true); // Use true to check descendants
    for (let i = 0; i < intersects.length; i++) {
        let object = intersects[i].object;
        // Check if the intersected object or its parent has the 'draggable' property
        while (object && !object.userData['draggable']) {
            object = object.parent;
        }
        if (object && object.userData['draggable']) {

            objectInfo.style.display = "flex";
            displayObjectInfo(object);
            break; // Only attach the first draggable object
        }
    }
}

let renderObjectModel = false
let objectInfoControls
let objectScene, objectCamera, objectRenderer

function objectSceneInit(objects) {
    // console.log(objects);
    objectScene = new Three.Scene();
    objectScene.background = new Three.Color("#ADD8E6");
    const modelSize = document.getElementById('object-model').getBoundingClientRect();

    // Set up camera
    objectCamera = new Three.PerspectiveCamera(75, modelSize.width / modelSize.height, 0.1, 1000);

    // Set up ambient light
    let ambientLight = new Three.AmbientLight(0xffffff, 5.0);
    objectScene.add(ambientLight);

    // Set up renderer
    const objectInfo = document.getElementById('object-model');
    objectRenderer = new Three.WebGLRenderer({ canvas: objectInfo });
    objectRenderer.setSize(modelSize.width, modelSize.height);

    // Set up OrbitControls
    objectInfoControls = new OrbitControls(objectCamera, objectRenderer.domElement);
    objectInfoControls.enabled = true;

    // Clone objects
    const clonedObjects = objects.clone();

    // Add cloned objects to the scene
    objectScene.add(clonedObjects);

    // Calculate the bounding box of the cloned objects
    const boundingBox = new Three.Box3().setFromObject(clonedObjects);

    // Calculate the center of the bounding box
    const center = new Three.Vector3();
    boundingBox.getCenter(center);

    // Set camera position to look at the center of the bounding box
    objectCamera.position.set(center.x, center.y, boundingBox.max.z + 2);

    // Set the target of the OrbitControls to the center of the bounding box
    objectInfoControls.target.set(center.x, center.y, center.z);

    // Update the camera and controls
    objectCamera.updateProjectionMatrix();
    objectInfoControls.update();

    // Render the scene
    objectRenderer.render(objectScene, objectCamera);
}



function displayObjectInfo(selectedObject) {
    // Set the content of object-info based on the userData of the selected object
    // You can customize this part based on your object structure
    canvas.style.pointerEvents = "none"
    objectInfo.style.pointerEvents = "auto"
    userDataTitle.innerHTML = `<h2>Title: ${selectedObject.userData["title"]}</h2>`
    userDataContent.innerHTML = `<p>Info: ${selectedObject.userData["content"]}</p>`
    userDataTitle.style.display = "inline-block";
    userDataContent.style.display = "inline-block";

    //enables object selected to be rendered in object info
    renderObjectModel = true
    objectSceneInit(selectedObject)
    // console.log(selectedObject)

}

closeButton.addEventListener("click", () => {
    objectInfo.style.display = "none"
    canvas.style.pointerEvents = "auto"
    renderObjectModel = false
    disposeObjectScene()
    if (objectInfoControls) {
        objectInfoControls.enabled = false; // Disable the controls when closing
    }

});

function disposeObjectScene() {
    objectScene = null;
    objectCamera = null;
    objectRenderer = null;
    objectInfoControls = null;
}

////////// SPLINES START //////////////

const positions = [];

const ARC_SEGMENTS = 200;
let spline;

function spline_init() {
    const geometry = new Three.BufferGeometry();
    geometry.setAttribute('position', new Three.BufferAttribute(new Float32Array(ARC_SEGMENTS * 3), 3));
    let curve = new Three.CatmullRomCurve3(positions);
    curve.curveType = 'catmullrom';
    // curve.curveType = 'centripetal';
    // curve.curveType = 'chordal';
    curve.mesh = new Three.Line(geometry.clone(), new Three.LineBasicMaterial({
        color: 0xff0000,
        opacity: 0.35
    }));
    // curve.mesh.castShadow = true;
    spline = curve;
    scene.add(curve.mesh)
}


function updateSplineOutline() {
    if (positions.length < 2) return;
    const splineMesh = spline.mesh;
    const position = splineMesh.geometry.attributes.position;
    for (let i = 0; i < ARC_SEGMENTS; i++) {
        const t = i / (ARC_SEGMENTS - 1);
        let point = new Three.Vector3();
        spline.getPoint(t, point);
        position.setXYZ(i, point.x, point.y, point.z);
    }
    position.needsUpdate = true;
}

function loadSplinePoints(new_positions) {
    positions.length = 0;
    for (let i = 0; i < new_positions.length; i++) {
        positions.push(new_positions[i]);
    }
    updateSplineOutline();
}

////////// SPLINES END ////////////////

let keyboard = [];
addEventListener('keyup', (event) => { keyboard[event.key] = false; })
addEventListener('keydown', (event) => { keyboard[event.key] = true; });


function render_scene() {

    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    // calculate objects intersecting the picking ray
    let intersects = raycaster.intersectObjects(scene.children, true); // Use true to check descendants
    if (intersects.length > 0) {
        for (let i = 0; i < intersects.length; i++) {
            let object = intersects[i].object;
            // Check if the intersected object or its parent has the 'draggable' property
            while (object && !object.userData['draggable']) {
                object = object.parent;
            }
            if (object && object.userData['draggable'] && object.userData['title']) {
                // console.log("collider?")

                object.add(labelObject);
                labelDiv.textContent = object.userData.title
                labelObject.visible = true

                break; // Only attach the first draggable object
            }
        }
    } else {
        labelObject.visible = false
    }

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera)

    if (renderObjectModel) {
        objectRenderer.render(objectScene, objectCamera);
    }
}


let tAlongSpline = 0;

function camera_along_spline() {
    let dt = clock.getDelta();
    let curveSpeed = 0.1;

    if (keyboard['w']) {
        tAlongSpline += curveSpeed * dt;
    }
    if (keyboard['s']) {
        tAlongSpline -= curveSpeed * dt;
    }


    if (tAlongSpline >= 1.0) tAlongSpline = 1.0;
    if (tAlongSpline <= 0) tAlongSpline = 0;


    let camPos = spline.getPoint(tAlongSpline);
    camera.position.copy(camPos);
}

function update() {

    mouse_controls.update();

    if (spline && positions.length > 0)
        camera_along_spline();

    render_scene();

    requestAnimationFrame(update);
}


function main() {

    sceneName = get_url_param('scene');

    spline_init();

    if (sceneName != "blank") {
        console.log(`Loading Scene: ${sceneName}`);
        loadScene(sceneName + ".conf");
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    // document.body.appendChild(renderer.domElement);

    camera.position.z = 5;
    update();
}

document.addEventListener('DOMContentLoaded', main());

function loadScene() {
    // this basically has all the scene and object info, we'll split them in the backend for now I suppose
    addedObjs = []
    addedSplats = []

    while (scene.children.length > popLength) {
        scene.remove(scene.children.pop());
    }
    fetch(`http://localhost:3000/readFile?filename=${sceneName}.conf`).then(response => {
        if (!response.ok) {
            return response.json().then(res => { throw new Error(res.message) });
        }
        return response.json();
    })
        .then(data => {
            console.log(data);
            let tempArr = []
            console.log(data.ksplats)
            viewer.addSplatScenes(data.ksplats)

            var receivedObjs = data.objects //converted to added objs in next bit of code
            addedSplats = data.ksplats

            if (data.cameraPaths)
                loadSplinePoints(data.cameraPaths)

            spline_init();
            updateSplineOutline();

            // Done? TODO: @nisan need to add the thing for rotating the objects as well, I don't want to think about them
            // Rebuild objects
            data.objects.forEach(obj => {
                loader.load(
                    // resource URL
                    obj.path,
                    // called when the resource is loaded
                    function (gltf) {
                        gltf.scene.userData['draggable'] = true;
                        scene.add(gltf.scene);
                        let tempObj = {
                            'path': obj.path,
                            'name': obj.name,
                            'ref': gltf.scene //remove transform and add active reference when loading scene
                        }
                        gltf.scene.userData = obj.userData;
                        addedObjs.push(tempObj);

                        //Set Transforms from config file.
                        gltf.scene.position.set(obj.transform.position.x, obj.transform.position.y, obj.transform.position.z);
                        let quaternion = new Three.Quaternion().fromArray(obj.transform.rotation);
                        gltf.scene.setRotationFromQuaternion(quaternion);
                        gltf.scene.scale.set(obj.transform.scale.x, obj.transform.scale.y, obj.transform.scale.z);

                        // @nisan has done something here
                    },
                    // called while loading is progressing
                    function (xhr) {
                        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                    },
                    // called when loading has errors
                    function (error) {
                        console.log('An error happened:', error);
                    }
                );
            });

            console.log(receivedObjs, " vs", addedObjs)
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });

}