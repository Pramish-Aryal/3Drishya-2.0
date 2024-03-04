import * as Three from 'three';
import { MathUtils, randFloat } from 'three/src/math/MathUtils.js';
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

const light = new Three.AmbientLight(0xffffff); // soft white light
scene.add(light);

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

// const sceneName = get_url_param('name');

scene.add(viewer);
window.viewer = viewer
window.scene = scene
    // scene.add(viewer2);
let sceneName

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

        let index = addedSplats.length;
        let splatScene = viewer.getSplatScene(index);
        let splat = {
            'path': filePath,
            'name': fileName,
            'transform': {
                'position': splatScene.position,
                'rotation': splatScene.quaternion.toArray(),
                'scale': splatScene.scale,
            }
        }

        console.log(splat)
        addedSplats.push(splat);
    });
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
        function(gltf) {
            scene.add(gltf.scene);

            let obj = {
                'path': filePath,
                'name': objName,
                'ref': gltf.scene //remove ref with transfrom when saving scene

            }
            addedObjs.push(obj);
        },
        // called while loading is progressing
        function(xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        // called when loading has errors
        function(error) {
            console.log('An error happened');
        }
    );


    // Do something with the file name and path
    console.log("Model File name:", fileName);
    console.log("Model File path:", filePath);
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
    animate();
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
        addedSplats[index].transform = {
            'position': splatScene.position,
            'rotation': splatScene.quaternion.toArray(),
            'scale': splatScene.scale.toArray(),
        };
    }

    var ObjsToSave = [];
    // @nisan, the objects ' transform is not being saved, do it
    for (let index = 0; index < addedObjs.length; ++index) {
        let obj = {
            'path': addedObjs[index].path,
            'name': addedObjs[index].name,
            'transform': {
                'position': addedObjs[index].ref.position,
                'rotation': addedObjs[index].ref.quaternion.toArray(),
                'scale': addedObjs[index].ref.scale
            }
            //exchange ref with transfrom when saving scene
        }
        ObjsToSave.push(obj);
    }

    let dataToSend = {
        objects: ObjsToSave,
        ksplats: addedSplats,
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

    while (scene.children.length > 2) {
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
            data.ksplats.forEach(splat => {
                viewer.addSplatScene(splat.path, {
                    'splatAlphaRemovalThreshold': 5,
                    'position': splat.transform.position,
                    'rotation': splat.transform.rotation,
                    'scale': splat.transform.scale,
                }).then(data => {});
            });

            addedObjs = data.objects
            addedSplats = data.ksplats
                // TODO: @nisan need to add the thing for rotating the objects as well, I don't want to think about them
                // Rebuild objects
            data.objects.forEach(obj => {
                loader.load(
                    // resource URL
                    obj.path,
                    // called when the resource is loaded
                    function(gltf) {

                        scene.add(gltf.scene).then;
                        console.log(obj)

                        //Set Transforms from config file.
                        gltf.scene.position.set(obj.transform.position.x, obj.transform.position.y, obj.transform.position.z);

                        // Set rotation (using quaternion)
                        let quaternion = new THREE.Quaternion().fromArray(obj.transform.rotation);
                        gltf.scene.setRotationFromQuaternion(quaternion);

                        // Set scale
                        gltf.scene.scale.set(obj.transform.scale.x, obj.transform.scale.y, obj.transform.scale.z);

                        // @nisan probably do something here
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


        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });

}