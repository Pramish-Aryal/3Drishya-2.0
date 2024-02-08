let angle = 50

export {update_angle, get_angle}

function update_angle() {
    angle += 0.01;
}

function get_angle() {
    return angle;
}

class Rotation {
    constructor(angle) {
        this.angle = 0;
    }

    
}