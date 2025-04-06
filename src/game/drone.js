\

export function createDrone(scene) {
    if (!BABYLON || !scene) {
        console.error("Babylon.js or scene not available for drone creation!");
        return null;
    }

    
    const droneMass = 1.0;
    const droneRestitution = 0.1;
    const droneFriction = 0.3;
    const physicsSphere = BABYLON.MeshBuilder.CreateSphere("dronePhysicsSphere", { diameter: 1 }, scene);
    physicsSphere.position = new BABYLON.Vector3(0, 5, 0); 
    physicsSphere.isVisible = false; 

    
    physicsSphere.physicsImpostor = new BABYLON.PhysicsImpostor(
        physicsSphere,
        BABYLON.PhysicsImpostor.SphereImpostor,
        { mass: droneMass, restitution: droneRestitution, friction: droneFriction },
        scene
    );
    
    physicsSphere.physicsImpostor.physicsBody.angularDamping = 1.0;
    physicsSphere.physicsImpostor.physicsBody.fixedRotation = true;
    physicsSphere.physicsImpostor.physicsBody.updateMassProperties();

    
    const droneVisual = new BABYLON.TransformNode("droneVisual", scene);
    droneVisual.parent = physicsSphere; 

    const body = BABYLON.MeshBuilder.CreateBox("droneBody", { width: 0.8, height: 0.2, depth: 1.2 }, scene); 
    body.material = new BABYLON.StandardMaterial("droneMat", scene);
    body.material.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.4); 
    body.parent = droneVisual;

    
    const rotorMaterial = new BABYLON.StandardMaterial("rotorMat", scene);
    rotorMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1); 
    const rotorPositions = [
        new BABYLON.Vector3(0.5, 0.1, 0.5),
        new BABYLON.Vector3(-0.5, 0.1, 0.5),
        new BABYLON.Vector3(0.5, 0.1, -0.5),
        new BABYLON.Vector3(-0.5, 0.1, -0.5)
    ];
    rotorPositions.forEach((pos, i) => {
        const rotor = BABYLON.MeshBuilder.CreateCylinder(`rotor${i}`, { height: 0.05, diameter: 0.4 }, scene);
        rotor.material = rotorMaterial;
        rotor.position = pos;
        rotor.parent = droneVisual;
    });

    console.log("Drone created.");
    return physicsSphere; 
}


export function applyDroneMovement(dronePhysicsSphere, inputState, scene) {
    if (!dronePhysicsSphere || !dronePhysicsSphere.physicsImpostor || !inputState || !scene) return;

    const delta = scene.getEngine().getDeltaTime() / 1000.0; 
    const moveForce = 15; 
    const strafeForce = 10; 
    const liftForce = 25; 
    const rotationTorque = 2; 
    const maxLinearVelocity = 15;
    const maxAngularVelocity = 5;

    const body = dronePhysicsSphere.physicsImpostor.physicsBody;

    
    const forwardDirection = dronePhysicsSphere.forward.normalize();
    const rightDirection = dronePhysicsSphere.right.normalize();
    const upDirection = BABYLON.Vector3.Up();

    let force = new BABYLON.Vector3(0, 0, 0);
    let torque = new BABYLON.Vector3(0, 0, 0);

    
    if (inputState.forward) {
        force = force.add(forwardDirection.scale(moveForce));
    }
    if (inputState.backward) {
        force = force.add(forwardDirection.scale(-moveForce * 0.7)); 
    }
    if (inputState.left) {
        force = force.add(rightDirection.scale(-strafeForce));
    }
    if (inputState.right) {
        force = force.add(rightDirection.scale(strafeForce));
    }
    if (inputState.up) {
        force = force.add(upDirection.scale(liftForce));
    }
    if (inputState.down) {
        force = force.add(upDirection.scale(-liftForce * 0.6)); 
    }

    
    if (inputState.rotateLeft) {
        torque = torque.add(upDirection.scale(-rotationTorque));
    }
    if (inputState.rotateRight) {
        torque = torque.add(upDirection.scale(rotationTorque));
    }

    
    dronePhysicsSphere.physicsImpostor.applyForce(force, dronePhysicsSphere.getAbsolutePosition());
    dronePhysicsSphere.physicsImpostor.applyTorque(torque);

    
    const currentVelocity = body.velocity;
    if (currentVelocity.lengthSquared() > maxLinearVelocity * maxLinearVelocity) {
        body.velocity = currentVelocity.normalize().scale(maxLinearVelocity);
    }

    
    const currentAngularVelocity = body.angularVelocity;
    if (currentAngularVelocity.lengthSquared() > maxAngularVelocity * maxAngularVelocity) {
        body.angularVelocity = currentAngularVelocity.normalize().scale(maxAngularVelocity);
    }
}
