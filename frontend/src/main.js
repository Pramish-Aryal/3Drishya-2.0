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

const cubes = [ create_cube(new Vector3(1, 0, 0), new Vector3(2, 3, 1), 0xff00ff), create_cube()];

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