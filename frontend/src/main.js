import * as Three from 'three';
import { MathUtils, randFloat } from 'three/src/math/MathUtils.js';
// import * as Math from 'three/src/math';
import { Vector3 } from 'three/src/math/Vector3.js';

import { get_angle, update_angle } from './mover.js';

import { create_cube } from './geometry_generator.js';

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { TransformControls } from 'three/addons/controls/TransformControls.js';

import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

import { GUI } from 'dat.gui';



const loader = new GLTFLoader();
// const renderer = new Three.WebGLRenderer();
let canvas = document.querySelector('.webgl_canvas');
let renderer = new Three.WebGLRenderer({ canvas: canvas, antialias: true });
const scene = new Three.Scene();
const camera = new Three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const light = new Three.AmbientLight(0xffffff); // soft white light
scene.add(light);

const spotLight = new Three.SpotLight(0xffffff, 4.5);
spotLight.position.set(0, 1500, 200);
spotLight.angle = Math.PI * 0.2;
spotLight.decay = 0;
spotLight.castShadow = true;
spotLight.shadow.camera.near = 200;
spotLight.shadow.camera.far = 2000;
spotLight.shadow.bias = - 0.000222;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

//object-info
let objectInfo = document.getElementById("object-info")
let userDataContent = document.getElementById("userDataContent");
let userDataTitle = document.getElementById("userDataTitle");
let editTitle = document.getElementById("editTitle");
let editContent = document.getElementById("editContent");
let editInfoButton = document.getElementById("editInfoButton");
let editTitleInfo = document.getElementById("editTitleInfo");
let editContentInfo = document.getElementById("editContentInfo");
let updateInfoButton = document.getElementById("updateInfoButton");
let cancelInfoButton = document.getElementById("cancelInfoButton");
let closeButton = document.getElementById("close-button");


let ActiveEuler = new Three.Euler();
let DegreeEuler = new Vector3();
camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);
// document.querySelector("#buttonDiv").appendChild(renderer.domElement);

const mouse_controls = new OrbitControls(camera, renderer.domElement);
mouse_controls.enableDamping = true;
mouse_controls.enablePan = true;
mouse_controls.enableZoom = true;

//transform control
const control = new TransformControls(camera, renderer.domElement);
control.addEventListener('change', render_scene);
control.addEventListener('dragging-changed', (event) => {
    mouse_controls.enabled = !event.value;
});

control.addEventListener('objectChange', () => {
    updateSplineOutline();
});

scene.add(control);


let addedSplats = [] // path array of splats
let splatsToAdd = []
let addedObjs = [] // path array of objects

let viewer = new GaussianSplats3D.DropInViewer({
    'gpuAcceleratedSort': true,
    'sharedMemoryForWorkers': false,
    'dynamicScene': true
});
window.viewer = viewer
window.scene = scene
// const sceneName = get_url_param('name');
let sceneName = "";
scene.add(viewer);

const popLength = scene.children.length;
////////////////////////// Ensure That All Permanent (non reloaded elements when loading) are added above this line////////////////////

///    GUI for Splat Movement ////
// const gui = new GUI();
let gui = new GUI({ autoPlace: false });
var splatEditor = document.getElementById('splat-editor');
splatEditor.appendChild(gui.domElement);


const objectControls = gui.addFolder('Splat Controls');
let selectedObjectDropDown = { "selectedObject": null };
let selectedObject = null
// Dropdown list for object selection
let objectList = {};

let objectController = null;


let positionFolder = null;
let positionXController, positionYController, positionZController;
// Create input fields for rotation
let rotationFolder = null;
let rotationXController, rotationYController, rotationZController;
// Create input fields for scale
let scaleFolder = null;
let scaleXController, scaleYController, scaleZController;

function UpdateSplatUIList() {
    console.log("added splats are", addedSplats)

    for (let index = 0; index < addedSplats.length; index++) {
        objectList[addedSplats[index].name] = viewer.getSplatScene(index);
    }
    removeTransformFolder(objectControls);
    if (objectController) objectControls.remove(objectController)
    objectController = objectControls.add(selectedObjectDropDown, "selectedObject", Object.keys(objectList)).name('Select Object');

    createTransformFolder(objectControls)

    objectController.onChange(() => {
        let selectedObjectName = selectedObjectDropDown.selectedObject
        // console.log(selectedObjectName)
        selectedObject = objectList[selectedObjectName]
        // console.log(objectList[selectedObjectName])
        removeControllers();
        if (selectedObject) {
            createControllers(selectedObject);
        }
    })
}


UpdateSplatUIList()

// scene.traverse((child) => {
//     if (child instanceof Three.Mesh) {
//         if (child.name) {
//             objectList[child.name] = child;
//         }
//     }
// });
// console.log(objectList)

// console.log(objectController)
function createTransformFolder(objectControls) {
    positionFolder = objectControls.addFolder('Position');
    rotationFolder = objectControls.addFolder('Rotation');
    scaleFolder = objectControls.addFolder('Scale');
}

function removeTransformFolder(objectControls) {
    removeControllers()
    // if (positionFolder) objectControls.removeFolder(positionFolder);
    for (var key in objectControls.__folders) {
        var subfolder = objectControls.__folders[key];
        objectControls.removeFolder(subfolder);
    }
}
// Create input fields for position


function createControllers(selectedObject) {
    // Create input fields for position
    positionXController = positionFolder.add(selectedObject.position, 'x').name('X Position');
    positionYController = positionFolder.add(selectedObject.position, 'y').name('Y Position');
    positionZController = positionFolder.add(selectedObject.position, 'z').name('Z Position');

    // Create input fields
    // for rotation
    ActiveEuler = new Three.Euler();

    let quat = new Three.Quaternion(selectedObject.quaternion._x, selectedObject.quaternion._y, selectedObject.quaternion._z, selectedObject.quaternion._w,);
    ActiveEuler = ActiveEuler.setFromQuaternion(quat, 'XYZ');

    DegreeEuler.x = ActiveEuler.x * (180 / Math.PI);
    DegreeEuler.y = ActiveEuler.y * (180 / Math.PI);
    DegreeEuler.z = ActiveEuler.z * (180 / Math.PI);
    rotationXController = rotationFolder.add(DegreeEuler, 'x', 0, 360).name('X Rotation');
    rotationYController = rotationFolder.add(DegreeEuler, 'y', 0, 360).name('Y Rotation');
    rotationZController = rotationFolder.add(DegreeEuler, 'z', 0, 360).name('Z Rotation');

    // Create input fields for scale
    scaleXController = scaleFolder.add(selectedObject.scale, 'x').name('X Scale');
    scaleYController = scaleFolder.add(selectedObject.scale, 'y').name('Y Scale');
    scaleZController = scaleFolder.add(selectedObject.scale, 'z').name('Z Scale');

}

// Function to remove controllers
function removeControllers() {
    if (positionXController) positionFolder.remove(positionXController);
    if (positionYController) positionFolder.remove(positionYController);
    if (positionZController) positionFolder.remove(positionZController);
    if (rotationXController) rotationFolder.remove(rotationXController);
    if (rotationYController) rotationFolder.remove(rotationYController);
    if (rotationZController) rotationFolder.remove(rotationZController);
    if (scaleXController) scaleFolder.remove(scaleXController);
    if (scaleYController) scaleFolder.remove(scaleYController);
    if (scaleZController) scaleFolder.remove(scaleZController);
}


// objectController.onChange(updateSelectedObject);


function updateObject(selectedObject) {
    // // Update selected object based on input values

    // selectedObject.position.x = parseFloat(positionFolder.__controllers[0].object.x);
    // console.log("tf")
    // selectedObject.position.y = parseFloat(positionFolder.__controllers[1].object.y);
    // selectedObject.position.z = parseFloat(positionFolder.__controllers[2].object.z);

    // let euler = new Three.Euler(parseFloat(rotationFolder.__controllers[0].object.x), parseFloat(rotationFolder.__controllers[1].object.y), parseFloat(rotationFolder.__controllers[2].object.z));
    // let quat = new Three.Quaternion();
    // quat = quat.setFromEuler(euler)
    // selectedObject.quaternion.copy(quat);
    // console.log(quat, "   vs ", selectedObject.quaternion);
    // // selectedObject.quaternion._x = quat.x;
    // // selectedObject.quaternion._y = quat.y;
    // // selectedObject.quaternion._z = quat.z;
    // // selectedObject.quaternion._w = quat.w;

    // selectedObject.scale.x = parseFloat(scaleFolder.__controllers[0].object.x);
    // selectedObject.scale.y = parseFloat(scaleFolder.__controllers[1].object.y);
    // selectedObject.scale.z = parseFloat(scaleFolder.__controllers[2].object.z);

}






//////////    GUI END   ///////////////




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

canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

// make it so that only one object can be dragged
canvas.addEventListener('mousedown', (event) => {
    const isShiftPressed = event.shiftKey;
    const mouse = new Three.Vector2();
    const raycaster = new Three.Raycaster();

    // calculate mouse position in normalized device coordinates
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

            if (event.button === 0 && isShiftPressed) {
                control.attach(object);
            } else if (event.button === 2 && isShiftPressed) {
                objectInfo.style.display = "flex";
                displayObjectInfo(object);
            } else if (event.button == 1) {

            }
            break; // Only attach the first draggable object
        }
    }
});


// canvas.addEventListener('mousemove', (event) => {
//     const mouse = new Three.Vector2();
//     const raycaster = new Three.Raycaster();

//     // calculate mouse position in normalized device coordinates
//     mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//     mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

//     // update the picking ray with the camera and mouse position
//     raycaster.setFromCamera(mouse, camera);

//     // calculate objects intersecting the picking ray
//     let intersects = raycaster.intersectObjects(scene.children, true); // Use true to check descendants
//     for (let i = 0; i < intersects.length; i++) {
//         let object = intersects[i].object;
//         // Check if the intersected object or its parent has the 'draggable' property
//         while (object && !object.userData['draggable']) {
//             object = object.parent;
//         }
//         if (object && object.userData['draggable'] && object.userData['title']) {

//             object.add(labelObject);
//             labelDiv.textContent =  object.userData.title
//             labelObject.visible = true

//             break; // Only attach the first draggable object
//         }
//         else{
//             object = null;
//             labelObject.visible = false
//         }
//     }
// });


// Overlay Scene
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


    // Show the "edit" button
    editInfoButton.style.display = "inline-block";
    // const objectSceneInfo = objectScene(selectedObject);

    // renderObjectScene(objectSceneInfo);
    // console.log(selectedObject.userData.info)

    // Event listener for the "edit" button
    editInfoButton.onclick = () => editUserData(selectedObject);
    // Event listener for the "update" button
    updateInfoButton.onclick = () => updateUserData(selectedObject);

    // editInfoButton.style.display = "none";

}

function editUserData(selectedObject) {
    // Hide "edit" button, display input and "update" button
    userDataTitle.style.display = "none";
    userDataContent.style.display = "none";
    editInfoButton.style.display = "none";
    editTitle.style.display = "inline-block";
    editContent.style.display = "inline-block";
    updateInfoButton.style.display = "inline-block";
    cancelInfoButton.style.display = "inline-block";
    // Populate input with current userData
    // editInfo.value = selectedObject.userData.info;
    editTitleInfo.value = selectedObject.userData["title"];
    editContentInfo.value = selectedObject.userData["content"];
}


function updateUserData(selectedObject) {
    // Update userData with the value from the input
    selectedObject.userData.title = editTitleInfo.value;
    selectedObject.userData.content = editContentInfo.value;

    // Display updated content
    displayObjectInfo(selectedObject);

    // Hide input and update button
    // editInfo.style.display = "none";
    userDataTitle.style.display = "inline-block";
    userDataContent.style.display = "inline-block";
    editTitle.style.display = "none";
    editContent.style.display = "none";
    updateInfoButton.style.display = "none";
    cancelInfoButton.style.display = "none";
}

cancelInfoButton.addEventListener("click", () => {
    // Hide input and update buttons
    userDataTitle.style.display = "inline-block";
    userDataContent.style.display = "inline-block";
    editInfoButton.style.display = "inline-block";
    // editInfo.style.display = "none";
    editTitle.style.display = "none";
    editContent.style.display = "none";
    updateInfoButton.style.display = "none";
    cancelInfoButton.style.display = "none";
});

closeButton.addEventListener("click", () => {
    objectInfo.style.display = "none"
    // editInfo.style.display = "none";
    // editTitle.style.display = "none";
    // editContent.style.display = "none";
    // updateInfoButton.style.display = "none";
    // cancelInfoButton.style.display = "none";
    // controlPanel.style.pointerEvents = "auto"
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

let keyboard = [];

addEventListener('keyup', (event) => {
    keyboard[event.key] = false;
})

window.addEventListener('keydown', function (event) {
    keyboard[event.key] = true;
    switch (event.key.toLowerCase()) {
        case "w": control.setMode('translate'); break;
        case "r": control.setMode('rotate'); break;
        case "e": control.setMode('scale'); break;
        case "num+": control.setSize(control.size + 0.1); break;
        case "num-": control.setSize(Math.max(control.size - 0.1, 0.1)); break;
        case "x": control.showX = !control.showX; break;
        case "y": control.showY = !control.showY; break;
        case "z": control.showZ = !control.showZ; break;
        case "escape": control.detach(); break;
        case "c":
            console.log(camera.position);
            addPoint(camera.position);
            break;
    }

});


//////////////////// SPLINES //////////////////

const splineHelperObjects = [];
let splinePointsLength = 0;
const positions = [];
const point = new Three.Vector3();

const geometry = new Three.BoxGeometry(0.1, 0.1, 0.1);
const ARC_SEGMENTS = 200;
let spline;

function spline_init() {
    for (let i = 0; i < splinePointsLength; i++) {
        addSplineObject(positions[i]);
    }

    positions.length = 0;

    for (let i = 0; i < splinePointsLength; i++) {
        positions.push(splineHelperObjects[i].position);
    }

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

    render_scene();
}

function addSplineObject(position) {

    if (position == undefined) {
        return;
    }
    const material = new Three.MeshLambertMaterial({ color: Math.random() * 0xffffff });
    const object = new Three.Mesh(geometry, material);
    object.position.copy(position);
    // object.castShadow = true;
    // object.receiveShadow = true;
    object.userData['draggable'] = true;
    scene.add(object);
    splineHelperObjects.push(object);
    return object;
}

function addPoint(position) {
    splinePointsLength++;
    positions.push(addSplineObject(position).position);
    updateSplineOutline();
    render_scene();
}

function removeAllPoints() {
    if (control.object === point) control.detach();
    splineHelperObjects.forEach(obj => scene.remove(obj));
    splineHelperObjects.length = 0;
    splinePointsLength = 0;
    positions.length = 0;
    updateSplineOutline();
    render_scene();
}

function updateSplineOutline() {
    if (splinePointsLength < 2) return;
    const splineMesh = spline.mesh;
    const position = splineMesh.geometry.attributes.position;

    for (let i = 0; i < ARC_SEGMENTS; i++) {
        const t = i / (ARC_SEGMENTS - 1);
        spline.getPoint(t, point);
        position.setXYZ(i, point.x, point.y, point.z);
    }
    position.needsUpdate = true;
}

function loadSplinePoints(new_positions) {
    removeAllPoints();

    for (let i = 0; i < new_positions.length; i++) {
        addPoint(new_positions[i]);
    }

    updateSplineOutline();
}


////////////////// SPLINES END ////////////////

function render_scene() {
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera)
    if (renderObjectModel) {
        objectRenderer.render(objectScene, objectCamera);
    }
}

function update() {

    mouse_controls.update();

    if (selectedObject) {
        let quat = new Three.Quaternion();
        ActiveEuler.x = DegreeEuler.x * Math.PI / 180;
        ActiveEuler.y = DegreeEuler.y * Math.PI / 180;
        ActiveEuler.z = DegreeEuler.z * Math.PI / 180;
        quat = quat.setFromEuler(ActiveEuler)
        selectedObject.quaternion.copy(quat);
    }

    // const quaternion = new Three.Quaternion();
    // quaternion.setFromAxisAngle(new Three.Vector3(1, 0, 0), angle);
    // viewer.getSplatScene(0).quaternion.copy(quaternion);
    // angle += Math.PI / 10;




    update_angle();

    render_scene();

    requestAnimationFrame(update);
}

function get_url_param(key) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(key)
}

function handleLoadKsplat(event) {
    const file = event.target.files[0]; // Get the selected file
    const fileName = file.name; // Get the file name
    // const filePath = URL.createObjectURL(file); // Get the file path
    const filePath = `/data/ksplats/${fileName}`
    // Do something with the file name and path
    console.log("Ksplat File name:", fileName);
    console.log("Ksplat File path:", filePath);

    // our file path is always assumed to be filePath

    const quaternion = new Three.Quaternion();
    quaternion.setFromAxisAngle(new Three.Vector3(1, 0, 0), Math.PI);

    // viewer.addSplatScenes([{
    //     'path': '/data/ksplats/civil bench wide.ksplat',
    //     'splatAlphaRemovalThreshold': 20,
    //     'position': [0, 10, 0],
    // }
    //     , {
    //     'path': '/data/ksplats/civil bench.ksplat',
    //     'rotation': quaternion.toArray(),
    //     'scale': [0.1, 0.1, 0.1],
    //     'position': [0, 0, 0],

    // }
    // ]);
    let tempSplat = {
        'path': filePath,
        'name': fileName,
        'splatAlphaRemovalThreshold': 5,
        'position': [0, 0, 0],
        'rotation': quaternion.toArray(),
        'scale': [1, 1, 1],

    }



    addedSplats.push(tempSplat);
    viewer.addSplatScenes(addedSplats)


    // for (let index = 0; index < addedSplats.length; ++index) {
    //     let splatScene = viewer.getSplatScene(index);
    //     addedSplats[index].position = splatScene.position.toArray();
    //     addedSplats[index].quaternion = splatScene.quaternion.toArray()
    //     addedSplats[index].scale = splatScene.scale.toArray();
    // }
}


function handleLoadModel(event) {
    const file = event.target.files[0]; // Get the selected file
    const fileName = file.name; // Get the file name
    const objName = fileName.split('.')[0];
    const filePath = `/data/objs/${objName}/${fileName}`

    loader.load(
        // resource URL
        filePath,
        // called when the resource is loaded
        function (gltf) {
            gltf.scene.userData['draggable'] = true;
            scene.add(gltf.scene);
            gltf.scene.name = objName
            let obj = {
                'path': filePath,
                'name': objName,
                'ref': gltf.scene //remove ref with transfrom when saving scene

            }
            addedObjs.push(obj);
        },
        // called while loading is progressing
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        // called when loading has errors
        function (error) {
            console.log('An error happened');
        }
    );


    // Do something with the file name and path
    console.log("Model File name:", fileName);
    console.log("Model File path:", filePath);
}

function main() {

    sceneName = get_url_param('scene');



    // if (sceneName != "blank") {
    //     console.log(`Loading Scene: ${sceneName}`);
    //     loadScene(sceneName + ".conf");
    // }

    renderer.setSize(window.innerWidth, window.innerHeight);
    // document.body.appendChild(renderer.domElement);

    camera.position.z = 5;

    spline_init();

    update();
}

main();

//////////////////////// test to generate conf file

document.getElementById('fileInput1').addEventListener('change', handleLoadKsplat);
document.getElementById('fileInput2').addEventListener('change', handleLoadModel);

document.getElementById('saveSceneButton').addEventListener("click", saveScene);
document.getElementById('loadSceneButton').addEventListener("click", loadScene);

function saveScene() {
    // this basically has all the scene and object info, we'll split them in the backend for now I suppose

    for (let index = 0; index < addedSplats.length; ++index) {
        let splatScene = viewer.getSplatScene(index);
        addedSplats[index].position = splatScene.position.toArray();
        addedSplats[index].quaternion = splatScene.quaternion.toArray()
        addedSplats[index].scale = splatScene.scale.toArray();
    }

    var ObjsToSave = [];
    // @nisan, the objects ' transform is not being saved, do it
    for (let index = 0; index < addedObjs.length; ++index) {
        console.log("adding obj no:", index, addedObjs[index])
        let obj = {
            'path': addedObjs[index].path,
            'name': addedObjs[index].name,
            'transform': {
                'position': addedObjs[index].ref.position,
                'rotation': addedObjs[index].ref.quaternion.toArray(),
                'scale': addedObjs[index].ref.scale
            },
            'userData': addedObjs[index].ref.userData,
            //exchange ref with transfrom when saving scene
        }
        ObjsToSave.push(obj);
    }

    let dataToSend = {
        objects: ObjsToSave,
        ksplats: addedSplats,
        cameraPaths: positions
    };

    console.log("Sending data to save:", dataToSend);

    fetch(`http://localhost:3000/postFile?filename=${sceneName}.conf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(dataToSend)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            alert('JSON data saved successfully:', data)
            console.log('JSON data saved successfully:', data);
        })
        .catch(error => {
            alert('There was a problem saving the JSON data:', error)
            console.error('There was a problem saving the JSON data:', error);
        });
}

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

            addedSplats = data.ksplats
            viewer.addSplatScenes(data.ksplats).then(() => {

                console.log("added splats are", addedSplats)
                UpdateSplatUIList();
            })

            spline_init();

            if (data.cameraPaths)
                loadSplinePoints(data.cameraPaths)

            var receivedObjs = data.objects //converted to added objs in next bit of code
            // Done? TODO: @nisan need to add the thing for rotating the objects as well, I don't want to think about them
            // Rebuild objects
            data.objects.forEach(obj => {
                loader.load(
                    // resource URL
                    obj.path,
                    // called when the resource is loaded
                    function (gltf) {
                        gltf.scene.userData['draggable'] = true;
                        gltf.scene.name = obj.name;

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