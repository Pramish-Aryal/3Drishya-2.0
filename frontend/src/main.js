import * as Three from 'three';
import { MathUtils } from 'three/src/math/MathUtils.js';
// import * as Math from 'three/src/math';
import { Vector3 } from 'three/src/math/Vector3.js';

import { get_angle, update_angle } from './mover.js';

import { create_cube } from './geometry_generator.js';

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

const renderer = new Three.WebGLRenderer();

const scene = new Three.Scene();
const camera = new Three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);
document.querySelector("#buttonDiv").appendChild(renderer.domElement);

const mouse_controls = new OrbitControls(camera, renderer.domElement);
mouse_controls.enableDamping = true;
mouse_controls.enablePan = true;
mouse_controls.enableZoom = true;

const cubes = [] // [ create_cube(new Vector3(1, 0, 0), new Vector3(2, 3, 1), 0xff00ff), create_cube()];

let viewer = new GaussianSplats3D.DropInViewer({
    'gpuAcceleratedSort': true,
    'sharedMemoryForWorkers': false,
    'dynamicScene': true
});

scene.add(viewer);

let angle = 0;

function animate() {
    rotatesplats();
    cubes.forEach(cube => {
        cube.rotation.x = get_angle();
        cube.rotation.y = get_angle();
    });

    mouse_controls.update();

    if (ready) {

        const quaternion = new Three.Quaternion();
        quaternion.setFromAxisAngle(new Three.Vector3(1, 0, 0), angle);
        
        viewer.getSplatScene(0).quaternion.copy(quaternion);
        
        angle += Math.PI / 10;
    }

    update_angle();


    renderer.render(scene, camera);

    requestAnimationFrame(animate);
}

function get_url_param(key) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(key)
}

let ready = false;

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
    quaternion.setFromAxisAngle(new Three.Vector3(1, 0, 0), Math.PI / 2);

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
        // 'rotation': quaternion.toArray(),
    }).then(data => {
        ready = true;
        let index = 0;
        // viewer.getSplatScene(index).position = new Vector3(10, 10, 10);

        // viewer.getSplatScene(index).rotation = quaternion;

        // console.log(viewer.getSplatScene(index))

        // console.log("Halo my darling")
        viewer.getSplatScene(index).updateTransform()

        // console.log(scene.children[0]);

    });
    // {
    //     'path': '<path to .ply, .ksplat, or .splat file>',
    //     'rotation': [0, -0.857, -0.514495, 6.123233995736766e-17],
    //     'scale': [1.5, 1.5, 1.5],
    //     'position': [0, -2, -1.2]
    // }

    window.scene = scene

    console.log(scene)
}

function rotatesplats() {
    // viewer.rotation.x += .01;
    // viewer2.rotation.y -=.01;
}
function handleLoadModel(event) {
    const file = event.target.files[0]; // Get the selected file
    const fileName = file.name; // Get the file name
    const filePath = URL.createObjectURL(file); // Get the file path

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
    cubes.forEach(cube => {
        scene.add(cube);
    });
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