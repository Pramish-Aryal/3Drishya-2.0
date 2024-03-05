import * as Three from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

const renderer = new Three.WebGLRenderer();

const scene = new Three.Scene();
const camera = new Three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);

let sceneName = null

// document.addEventListener('DOMContentLoaded', function () {
//     // Get the value of the 'scene' parameter from the URL
//     const urlParams = new URLSearchParams(window.location.search);
//     sceneName = urlParams.get('scene');
  
//     console.log('Scene Name:', sceneName);
  
//   });

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

  function animate() {
    // rotatesplats();
    cubes.forEach(cube => {
        cube.rotation.x = get_angle();
        cube.rotation.y = get_angle();
    });

    mouse_controls.update();


    // update_angle();


    renderer.render(scene, camera);

    requestAnimationFrame(animate);
}


function main() {

    sceneName = get_url_param('scene');

    if (sceneName != "blank") {
        console.log(`Loading Scene: ${sceneName}`);
        loadScene(sceneName + ".conf");
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    cubes.forEach(cube => {
        scene.add(cube);
    });
    camera.position.z = 5;
    animate();
}

main();

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

