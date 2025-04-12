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

    // REMOVED Impostor creation: physicsSphere.physicsImpostor = new BABYLON.PhysicsImpostor(...)
    // Impostor will be added in main.js after physics is enabled.


    const droneVisual = new BABYLON.TransformNode("droneVisual", scene);
    droneVisual.parent = physicsSphere;

    // Load the GLB model asynchronously
    BABYLON.SceneLoader.ImportMeshAsync("", "src/graphic-models/", "drone.glb", scene).then((result) => { // Reverted filename
        const droneMesh = result.meshes[0]; // Assuming the main mesh is the first one
        if (droneMesh) {
            droneMesh.name = "droneModel";
            droneMesh.parent = droneVisual; // Parent the loaded mesh to the visual node

            // --- Adjust Scale and Rotation ---
            // Scale the model to approximate the previous primitive size (longest dimension ~1.2)
            // relative to the physics sphere (diameter 1).
            droneMesh.scaling = new BABYLON.Vector3(0.6, 0.6, 0.6);

            // Rotate if necessary (GLB models often face +Z or +X, Babylon uses +Z forward)
            // Rotating 90 degrees (PI/2) around Y-axis to potentially align forward direction.
            droneMesh.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, Math.PI / 2, 0);

            // Position adjustment within the visual node (if needed, e.g., to center it)
            droneMesh.position = new BABYLON.Vector3(0, -0.1, 0); // Small adjustment down

            // console.log("Drone GLB model loaded and attached."); // Removed log
        } else {
            console.error("Failed to load drone mesh from GLB."); // Reverted log message
        }
    }).catch(error => {
        console.error("Error loading drone GLB:", error); // Reverted log message
    });


    // console.log("Drone created."); // Removed log
    return physicsSphere; // Return the physics sphere immediately
}

// --- Drone Control Parameters ---
const moveForceMagnitude = 22;
const verticalForceMagnitude = 25;
const rotationSpeed = 1.5; // Radians per second for yaw
const stabilizationForceFactor = 2.0; // Damping factor when no horizontal input
const maxTiltAngle = 0.3; // Radians (approx 17 degrees) for visual tilt
const tiltLerpSpeed = 0.08; // Controls how quickly the drone tilts/returns visually

// --- Play Area Boundaries ---
const playAreaMinX = -49;
const playAreaMaxX = 49;
const playAreaMinZ = -49;
const playAreaMaxZ = 49;
const groundLevel = 0; // Assuming ground is at Y=0
const maxAltitude = 150;


// --- Update Drone Physics and Visuals (called in render loop) ---
export function updateDrone(drone, inputState, scene, camera) {
    if (!drone || !drone.physicsImpostor || !inputState || !scene || !camera) {
        // console.warn("Missing data for drone update."); // Can be noisy
        return;
    }

    const deltaTime = scene.getEngine().getDeltaTime() / 1000.0;
    const impostor = drone.physicsImpostor;

    // --- Drone Physics Control Logic ---

    // Calculate camera's forward and right vectors projected onto the horizontal plane
    const cameraForward = camera.getForwardRay().direction;
    const cameraRight = BABYLON.Vector3.Cross(camera.upVector, cameraForward); // Calculate right vector

    // Project onto horizontal plane (ignore Y component) and normalize
    const forwardDir = new BABYLON.Vector3(cameraForward.x, 0, cameraForward.z).normalize();
    const rightDir = new BABYLON.Vector3(cameraRight.x, 0, cameraRight.z).normalize();

    // Horizontal Movement Force (based on camera direction)
    let moveForce = BABYLON.Vector3.Zero();
    if (inputState.forward) moveForce.addInPlace(forwardDir);
    if (inputState.backward) moveForce.subtractInPlace(forwardDir);
    if (inputState.left) moveForce.subtractInPlace(rightDir); // Strafe left relative to camera
    if (inputState.right) moveForce.addInPlace(rightDir); // Strafe right relative to camera

    if (moveForce.lengthSquared() > 0) {
        moveForce.normalize().scaleInPlace(moveForceMagnitude);
    }

    // Vertical Movement Force (needs to counteract gravity)
    let verticalForce = BABYLON.Vector3.Zero();
    const gravityCompensation = 9.81 * impostor.mass; // Force needed to just hover

    if (inputState.up) {
        verticalForce.y = verticalForceMagnitude + gravityCompensation;
    } else if (inputState.down) {
        // Apply a downward force (gravity will add to this)
        verticalForce.y = -verticalForceMagnitude * 0.5; // Apply a moderate downward force
    } else {
        // Neither up nor down is pressed. Apply zero vertical force from controls.
        // Gravity will be handled by the physics engine.
        verticalForce.y = 0;
    }

    // Apply combined forces at the center of the drone
    impostor.applyForce(moveForce.add(verticalForce), drone.getAbsolutePosition());

    // Apply stabilization/damping force against horizontal movement when no input
    if (moveForce.lengthSquared() === 0) {
        const currentHorizontalVelocity = impostor.getLinearVelocity().clone();
        currentHorizontalVelocity.y = 0; // Ignore vertical component
        if (currentHorizontalVelocity.lengthSquared() > 0.01) { // Apply only if moving significantly
             const stabilizationForce = currentHorizontalVelocity.scale(-stabilizationForceFactor); // Force opposite to current velocity
             impostor.applyForce(stabilizationForce, drone.getAbsolutePosition());
         }
    }

    // --- Manual Rotation (Yaw) - Removed ---
    // let rotationChange = 0;
    // if (inputState.rotateLeft) rotationChange -= rotationSpeed * deltaTime; // Removed
    // if (inputState.rotateRight) rotationChange += rotationSpeed * deltaTime; // Removed
    //
    // // Apply rotation change to the physics sphere.
    // if (rotationChange !== 0) {
    //     drone.rotation.y += rotationChange;
    //     // Update the physics body's quaternion to match the Euler rotation
    //     const rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, drone.rotation.y, 0);
    //     impostor.physicsBody.quaternion.copy(rotationQuaternion);
    // }

    // --- Play Area Boundary Checks ---
    const currentPosition = drone.getAbsolutePosition(); // Get potentially updated position
    const currentVelocity = impostor.getLinearVelocity();
    let positionClamped = false;
    let velocityModified = false;

    // Check X boundaries
    if (currentPosition.x < playAreaMinX) {
        drone.position.x = playAreaMinX;
        if (currentVelocity && currentVelocity.x < 0) {
            impostor.setLinearVelocity(new BABYLON.Vector3(0, currentVelocity.y, currentVelocity.z));
            velocityModified = true;
        }
        positionClamped = true;
    } else if (currentPosition.x > playAreaMaxX) {
        drone.position.x = playAreaMaxX;
        if (currentVelocity && currentVelocity.x > 0) {
            impostor.setLinearVelocity(new BABYLON.Vector3(0, currentVelocity.y, currentVelocity.z));
            velocityModified = true;
        }
        positionClamped = true;
    }

    // Check Z boundaries
    if (currentPosition.z < playAreaMinZ) {
        drone.position.z = playAreaMinZ;
        // Use potentially modified velocity from X check
        const vel = velocityModified ? impostor.getLinearVelocity() : currentVelocity;
        if (vel && vel.z < 0) {
            impostor.setLinearVelocity(new BABYLON.Vector3(vel.x, vel.y, 0));
            velocityModified = true; // Mark as modified again if Z caused change
        }
        positionClamped = true;
    } else if (currentPosition.z > playAreaMaxZ) {
        drone.position.z = playAreaMaxZ;
        // Use potentially modified velocity from X check
        const vel = velocityModified ? impostor.getLinearVelocity() : currentVelocity;
        if (vel && vel.z > 0) {
            impostor.setLinearVelocity(new BABYLON.Vector3(vel.x, vel.y, 0));
            velocityModified = true; // Mark as modified again if Z caused change
        }
        positionClamped = true;
    }

    if (positionClamped) {
        // If position was clamped, we need to ensure the physics body's transform matches
        // This might be redundant if setLinearVelocity already updates things, but safer.
        impostor.physicsBody.position.copy(drone.position);
        console.log("Boundary limit reached.");
    }
    // --- End Play Area Boundary Checks ---


    // --- Altitude Limit Check (Re-added) ---
    // Apply this check *after* boundary checks and physics forces but before visual updates
    const currentPosForAltitudeCheck = drone.getAbsolutePosition(); // Get potentially updated position
    if (currentPosForAltitudeCheck.y > maxAltitude) {
        drone.position.y = maxAltitude; // Clamp position
        // Optional: Zero out upward velocity to prevent bouncing off the ceiling
        const currentVelocity = impostor.getLinearVelocity();
        if (currentVelocity && currentVelocity.y > 0) {
            impostor.setLinearVelocity(new BABYLON.Vector3(currentVelocity.x, 0, currentVelocity.z));
        }
         console.log("Altitude limit reached.");
    }
    // --- End Altitude Limit Check ---


    // --- Visual Tilt Logic ---
    const droneVisual = drone.getChildren().find(node => node.name === "droneVisual"); // Find the visual node
    if (droneVisual) {
        if (!droneVisual.rotationQuaternion) {
            droneVisual.rotationQuaternion = BABYLON.Quaternion.Identity();
        }

        // Get drone's local axes (using physics sphere's orientation)
        const droneMatrix = drone.computeWorldMatrix(true);
        const localForward = BABYLON.Vector3.TransformNormal(BABYLON.Axis.Z, droneMatrix).normalize();
        const localRight = BABYLON.Vector3.TransformNormal(BABYLON.Axis.X, droneMatrix).normalize();

        // Get current horizontal velocity
        const currentVelocity = impostor.getLinearVelocity();
        const horizontalVelocity = new BABYLON.Vector3(currentVelocity.x, 0, currentVelocity.z);

        // Project velocity onto drone's local axes
        const forwardSpeed = BABYLON.Vector3.Dot(horizontalVelocity, localForward);
        const rightSpeed = BABYLON.Vector3.Dot(horizontalVelocity, localRight);

        // Calculate target tilt angles (pitch based on forward, roll based on right)
        const targetPitch = -BABYLON.Scalar.Clamp(forwardSpeed * 0.1, -maxTiltAngle, maxTiltAngle);
        const targetRoll = BABYLON.Scalar.Clamp(rightSpeed * 0.1, -maxTiltAngle, maxTiltAngle);

        // Create target rotation quaternion from Euler angles (pitch, yaw=0, roll)
        const targetTiltQuaternion = BABYLON.Quaternion.FromEulerAngles(targetPitch, 0, targetRoll);

        // Smoothly interpolate the visual drone's rotation towards the target tilt
        BABYLON.Quaternion.SlerpToRef(
            droneVisual.rotationQuaternion,
            targetTiltQuaternion,
            tiltLerpSpeed,
            droneVisual.rotationQuaternion
        );
    }
    // --- End Visual Tilt Logic ---
}

// --- Function to Reset Drone State ---
export function resetDroneState(drone) {
    if (!drone || !drone.physicsImpostor) return;

    const impostor = drone.physicsImpostor;
    const respawnPosition = new BABYLON.Vector3(0, 15, -20); // Central, high respawn

    // Reset mesh position and rotation
    drone.position.copyFrom(respawnPosition);
    drone.rotation = BABYLON.Vector3.Zero(); // Reset Euler rotation
    if (drone.rotationQuaternion) {
        drone.rotationQuaternion.copyFrom(BABYLON.Quaternion.Identity());
    }

    // Reset physics body state AFTER setting mesh transform
    impostor.setLinearVelocity(BABYLON.Vector3.Zero());
    impostor.setAngularVelocity(BABYLON.Vector3.Zero());
    // Update physics body quaternion to match mesh rotation (important!)
    const rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, drone.rotation.y, 0);
    impostor.physicsBody.quaternion.copy(rotationQuaternion);

    // Reset visual tilt
    const droneVisual = drone.getChildren().find(node => node.name === "droneVisual");
    if (droneVisual && droneVisual.rotationQuaternion) {
        droneVisual.rotationQuaternion.copyFrom(BABYLON.Quaternion.Identity());
    }

    // console.log("Drone state reset."); // Removed log
}
