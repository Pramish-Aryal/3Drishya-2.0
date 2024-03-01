import * as Three from 'three';
import { MathUtils } from 'three/src/math/MathUtils.js';
// import * as Math from 'three/src/math';
import { Vector3 } from 'three/src/math/Vector3.js';

import { get_angle, update_angle } from './mover.js';

import { create_cube } from './geometry_generator.js';

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

const loader = new GLTFLoader();
const renderer = new Three.WebGLRenderer();
const scene = new Three.Scene();
const camera = new Three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const light = new Three.AmbientLight( 0xffffff ); // soft white light
scene.add( light );

camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);
document.querySelector("#buttonDiv").appendChild(renderer.domElement);

const mouse_controls = new OrbitControls(camera, renderer.domElement);
mouse_controls.enableDamping = true;
mouse_controls.enablePan = true;
mouse_controls.enableZoom = true;

let addedSplats = [] // path array of splats
let addedObjs = [] // path array of objects

let viewer = new GaussianSplats3D.DropInViewer({
    'gpuAcceleratedSort': true,
    'sharedMemoryForWorkers': false,
    'dynamicScene': true
});

scene.add(viewer);

function animate() {

    mouse_controls.update();

    // const quaternion = new Three.Quaternion();
    // quaternion.setFromAxisAngle(new Three.Vector3(1, 0, 0), angle);

    // viewer.getSplatScene(0).quaternion.copy(quaternion);

    // angle += Math.PI / 10;

    update_angle();


    renderer.render(scene, camera);

    requestAnimationFrame(animate);
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

    viewer.addSplatScene(filePath, {
        'splatAlphaRemovalThreshold': 5,
        'position': [0, 0, 0],
        'rotation': quaternion.toArray(),
    }).then(data => {
        //let index = 0;
        // viewer.getSplatScene(index).position = new Vector3(10, 10, 10);
        // viewer.getSplatScene(index).rotation = quaternion;
        //viewer.getSplatScene(index).updateTransform()

        let splat = {
            'path': filePath,
            'name': fileName,
        }
        addedSplats.push(splat);
    });
}

function handleLoadModel(event) {
    const file = event.target.files[0]; // Get the selected file
    const fileName = file.name; // Get the file name
    const filePath = `/data/objs/${fileName.split('.')[0]}/${fileName}`

    loader.load(
        // resource URL
        filePath,
        // called when the resource is loaded
        function ( gltf ) {
            scene.add( gltf.scene );
            
            let obj = {
                'path': filePath,
                'name': fileName,
            }
            addedObjs.push(obj);
        },
        // called while loading is progressing
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has errors
        function ( error ) {
            console.log( 'An error happened' );
        }
    );


    // Do something with the file name and path
    console.log("Model File name:", fileName);
    console.log("Model File path:", filePath);
}

function main() {

    const sceneName = get_url_param('name');

    if (sceneName != "blank") {
        console.log(`Loading Scene: ${sceneName}`);
        loadScene(sceneName + ".conf");
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    // document.body.appendChild(renderer.domElement);

    camera.position.z = 5;
    animate();
}

main();

//////////////////////// test to generate conf file

document.getElementById('fileInput1').addEventListener('change', handleLoadKsplat);
document.getElementById('fileInput2').addEventListener('change', handleLoadModel);

// document.getElementById('saveSceneButton').addEventListener("click", saveScene);
// document.getElementById('loadSceneButton').addEventListener("click", loadScene);

function saveScene() {
    // this basically has all the scene and object info, we'll split them in the backend for now I suppose
    let dataToSend = {
        objects: [],
        scene: scene.toJSON()
    };

    scene.traverse(object => {
        if (object.toJSON && object !== scene) {
            dataToSend.objects.push(object.toJSON());
        }
    });

    console.log(dataToSend);

    fetch('http://localhost:3000/postFile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(dataToSend)
    }).then(res => { });
}

function loadScene(sceneName) {
    // this basically has all the scene and object info, we'll split them in the backend for now I suppose
    fetch(`http://localhost:3000/readFile?filename=${sceneName}`).then(response => {
        if (!response.ok) {
            return response.json().then(res => { throw new Error(res.message) });
        }
        return response.json();
    })
        .then(data => {

            console.log('Loading Scene:', data);

            const loader = new Three.ObjectLoader();
            const sceneObj = loader.parse(data.scene);
            scene.copy(sceneObj, false);

            // Rebuild objects
            data.objects.forEach(objectData => {
                const obj = loader.parse(objectData);
                scene.add(obj);
            });


        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });

}