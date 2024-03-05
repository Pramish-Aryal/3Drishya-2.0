import * as Three from 'three';

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';


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

let viewer = new GaussianSplats3D.DropInViewer({
    'gpuAcceleratedSort': true,
    'sharedMemoryForWorkers': false,
    'dynamicScene': true
});

scene.add(viewer)




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





function gotoeditor(sceneName){
    window.location.href = `editor.html?scene=${sceneName}`;
  }

  const gotoEditorButton = document.getElementById('gotoEditorButton');
  if (gotoEditorButton) {
      gotoEditorButton.addEventListener('click', function () {
          gotoeditor(sceneName);
      });
  } 

  function render_scene() {
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
        function (gltf) {
            gltf.scene.userData['draggable'] = true;
            scene.add(gltf.scene);

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
                }).then(data => { });
            });

            var receivedObjs = data.objects //converted to added objs in next bit of code
            addedSplats = data.ksplats
            // TODO: @nisan need to add the thing for rotating the objects as well, I don't want to think about them
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