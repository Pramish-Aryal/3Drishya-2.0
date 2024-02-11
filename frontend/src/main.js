import * as Three from 'three';
import {MathUtils} from 'three/src/math/MathUtils.js';
// import * as Math from 'three/src/math';
import {Vector3} from 'three/src/math/Vector3.js';

import {get_angle, update_angle} from './mover.js';

import {create_cube} from './geometry_generator.js';

const renderer = new Three.WebGLRenderer();

const scene = new Three.Scene();
const camera = new Three.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);

const cubes = [] // [ create_cube(new Vector3(1, 0, 0), new Vector3(2, 3, 1), 0xff00ff), create_cube()];

function animate() {

    cubes.forEach(cube => {
        cube.rotation.x = get_angle();
        cube.rotation.y = get_angle();
    });

    update_angle();

	renderer.render( scene, camera );

	requestAnimationFrame( animate );
}


function main() {
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    cubes.forEach(cube => {
        scene.add( cube );
    });
    camera.position.z = 5;
    animate();
}

main();

//////////////////////// test to generate conf file

document.getElementById('saveSceneButton').addEventListener("click", saveScene);
document.getElementById('loadSceneButton').addEventListener("click", loadScene);

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
    }).then(res => {});
}

function loadScene() {
    // this basically has all the scene and object info, we'll split them in the backend for now I suppose
    
    fetch(`http://localhost:3000/readFile?filename=a.json`).then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
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