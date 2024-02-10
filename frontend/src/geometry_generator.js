import * as Three from 'three';
import {Vector3} from 'three/src/math/Vector3.js';

import * as fs from "fs";

// import * as Math from 'three/src/math';


export {create_cube}

function create_cube(position = new Vector3(), dim = new Vector3(1, 5, 3), color = 0xffffff) {
    const geometry = new Three.BoxGeometry( dim.x, dim.y, dim.z );
    const material = new Three.MeshBasicMaterial( { color } );
    let cube = new Three.Mesh( geometry, material );

    // cube.position.set(position)

    return cube;
}
