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

let sceneName = null
let addedSplats = [] // path array of splats
let splatsToAdd = []
let addedObjs = [] // path array of objects

// Text ko lagi init haru by Nisan
const labelDiv = document.createElement('div');
labelDiv.className = 'label';
const labelObject = new CSS2DObject(labelDiv);
labelObject.visible = false
const mouse = new Three.Vector2();
let raycaster = new Three.Raycaster();
document.addEventListener('mousemove', onDocumentMouseMove, false);


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
    gotoEditorButton.addEventListener('click', function() {
        gotoeditor(sceneName);
    });
}



function onDocumentMouseMove(event) {

    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

}

function render_scene() {



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
        if (object && object.userData['draggable'] && object.userData['title']) {
            console.log("collider?")

            object.add(labelObject);
            labelDiv.textContent = object.userData.title
            labelObject.visible = true

            break; // Only attach the first draggable object
        } else {
            object = null;
            labelObject.visible = false
        }
    }
    renderer.render(scene, camera);
}

function update() {

    mouse_controls.update();

    // const quaternion = new Three.Quaternion();
    // quaternion.setFromAxisAngle(new Three.Vector3(1, 0, 0), angle);

    // viewer.getSplatScene(0).quaternion.copy(quaternion);

    // angle += Math.PI / 10;


    render_scene();

    requestAnimationFrame(update);
}


function main() {

    sceneName = get_url_param('scene');

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

            // Done? TODO: @nisan need to add the thing for rotating the objects as well, I don't want to think about them
            // Rebuild objects
            data.objects.forEach(obj => {
                loader.load(
                    // resource URL
                    obj.path,
                    // called when the resource is loaded
                    function(gltf) {
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
                    function(xhr) {
                        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                    },
                    // called when loading has errors
                    function(error) {
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