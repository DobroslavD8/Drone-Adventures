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
            // droneMesh.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, Math.PI / 2, 0); // REMOVED initial visual mesh rotation

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
const selfRightingFactor = 2.5; // How strongly the drone tries to right itself

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
    // Get current velocity once for use throughout the function
    const currentVelocity = impostor.getLinearVelocity();

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

    // Check if there is active horizontal input before scaling
    const hasHorizontalInput = (inputState.forward || inputState.backward || inputState.left || inputState.right);

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
    // This force helps slow down linear movement when keys are released.
    if (!hasHorizontalInput) { // Use the input check here
        const currentHorizontalVelocity = impostor.getLinearVelocity().clone();
        currentHorizontalVelocity.y = 0; // Ignore vertical component
        if (currentHorizontalVelocity.lengthSquared() > 0.01) { // Apply only if moving significantly
             const stabilizationForce = currentHorizontalVelocity.scale(-stabilizationForceFactor); // Force opposite to current velocity
             impostor.applyForce(stabilizationForce, drone.getAbsolutePosition());
         }
    }

    // --- Play Area Boundary Checks ---
    const currentPosition = drone.getAbsolutePosition(); // Get potentially updated position
    // Use the currentVelocity declared earlier
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
        // console.log("Boundary limit reached."); // Removed log
    }
    // --- End Play Area Boundary Checks ---


    // --- Altitude Limit Check (Re-added) ---
    // Apply this check *after* boundary checks and physics forces but before visual updates
    const currentPosForAltitudeCheck = drone.getAbsolutePosition(); // Get potentially updated position
    if (currentPosForAltitudeCheck.y > maxAltitude) {
        drone.position.y = maxAltitude; // Clamp position
        // Optional: Zero out upward velocity to prevent bouncing off the ceiling
        // Use the currentVelocity declared earlier
        if (currentVelocity && currentVelocity.y > 0) {
            impostor.setLinearVelocity(new BABYLON.Vector3(currentVelocity.x, 0, currentVelocity.z));
        }
         // console.log("Altitude limit reached."); // Removed log
    }
    // --- End Altitude Limit Check ---


    // --- Drone Rotation (Yaw) and Self-Righting Logic ---
    const horizontalVelocityForYaw = new BABYLON.Vector3(currentVelocity.x, 0, currentVelocity.z); // Renamed for clarity
    const speedThreshold = 0.2; // Minimum speed to trigger rotation based on velocity
    let yawAngularVelocity = BABYLON.Vector3.Zero(); // Initialize yaw velocity

    // Calculate target yaw velocity only if there is active horizontal INPUT
    if (hasHorizontalInput && horizontalVelocityForYaw.lengthSquared() > speedThreshold * speedThreshold) {
        // --- Calculate Yaw Angular Velocity using Vector Math ---
        const currentPhysQuat = impostor.physicsBody.quaternion;
        const currentQuaternionBabylon = new BABYLON.Quaternion(
            currentPhysQuat.x, currentPhysQuat.y, currentPhysQuat.z, currentPhysQuat.w
        );
        const currentForward = new BABYLON.Vector3(0, 0, 1); // Local forward (+Z)
        currentForward.rotateByQuaternionToRef(currentQuaternionBabylon, currentForward);
        const targetDirection = horizontalVelocityForYaw.normalizeToNew();
        const rotationAxis = BABYLON.Vector3.Cross(currentForward, targetDirection);
        if (rotationAxis.lengthSquared() > 0.001) {
             rotationAxis.normalize();
        } else {
             rotationAxis.copyFrom(BABYLON.Vector3.Up());
        }
        const dotProduct = BABYLON.Scalar.Clamp(BABYLON.Vector3.Dot(currentForward, targetDirection), -1, 1);
        let rotationAngle = Math.acos(dotProduct);
        rotationAngle *= -1; // Fix reversed rotation
        const yawRotationSpeedFactor = 0.5; // Reduced sensitivity
        yawAngularVelocity = rotationAxis.scale(rotationAngle * yawRotationSpeedFactor);

        if (dotProduct < -0.999 && Math.abs(rotationAngle) > 0.1) {
             yawAngularVelocity = new BABYLON.Vector3(0, yawRotationSpeedFactor * Math.PI, 0);
        } else if (dotProduct > 0.999 || Math.abs(rotationAngle) < 0.01) {
             yawAngularVelocity = BABYLON.Vector3.Zero();
        }
    }

    // --- Calculate Self-Righting Angular Velocity ---
    let selfRightingAngularVelocity = BABYLON.Vector3.Zero();
    const currentPhysQuatSR = impostor.physicsBody.quaternion; // Get current quaternion again
    const currentQuatBabylonSR = new BABYLON.Quaternion(
        currentPhysQuatSR.x, currentPhysQuatSR.y, currentPhysQuatSR.z, currentPhysQuatSR.w
    );
    // Get the drone's local up vector in world space
    const localUp = new BABYLON.Vector3(0, 1, 0);
    localUp.rotateByQuaternionToRef(currentQuatBabylonSR, localUp);
    // Calculate the axis needed to rotate localUp towards world Up (0,1,0)
    const rightingAxis = BABYLON.Vector3.Cross(localUp, BABYLON.Vector3.Up());
    const upDot = BABYLON.Vector3.Dot(localUp, BABYLON.Vector3.Up());
    // Only apply righting torque if significantly tilted and axis is valid
    if (upDot < 0.99 && rightingAxis.lengthSquared() > 0.001) {
        rightingAxis.normalize();
        const rightingAngle = Math.acos(BABYLON.Scalar.Clamp(upDot, -1, 1));
        // Apply torque proportional to the angle, stronger than yaw
        selfRightingAngularVelocity = rightingAxis.scale(rightingAngle * selfRightingFactor);
    }

    // --- Combine and Apply Angular Velocities ---
    // If there's no input, prioritize stopping yaw rotation.
    // Always apply self-righting torque if needed.
    let finalAngularVelocity;
    if (!hasHorizontalInput) {
        // Damp existing yaw velocity slightly if stopping? Or just zero it? Let's zero it.
        const currentAV = impostor.getAngularVelocity() || BABYLON.Vector3.Zero();
        finalAngularVelocity = new BABYLON.Vector3(0, 0, 0); // Start with zero yaw/pitch/roll
        // Add only the self-righting component if needed
        finalAngularVelocity.addInPlace(selfRightingAngularVelocity);
        // Apply damping to the non-righting axes if needed? Maybe not necessary if setting directly.
    } else {
        // Combine calculated yaw and self-righting velocities
        finalAngularVelocity = yawAngularVelocity.add(selfRightingAngularVelocity);
    }

    impostor.setAngularVelocity(finalAngularVelocity);

    // --- End Drone Rotation (Yaw) and Self-Righting Logic ---


    // --- Visual Tilt Logic --- // Re-enabled
    const droneVisual = drone.getChildren().find(node => node.name === "droneVisual"); // Find the visual node
    if (droneVisual) {
        if (!droneVisual.rotationQuaternion) {
            droneVisual.rotationQuaternion = BABYLON.Quaternion.Identity();
        }

        // Get drone's local axes (using physics sphere's orientation)
        const droneMatrix = drone.computeWorldMatrix(true);
        const localForward = BABYLON.Vector3.TransformNormal(BABYLON.Axis.Z, droneMatrix).normalize();
        const localRight = BABYLON.Vector3.TransformNormal(BABYLON.Axis.X, droneMatrix).normalize();

        // Use the already fetched currentVelocity
        const horizontalVelocityForTilt = new BABYLON.Vector3(currentVelocity.x, 0, currentVelocity.z); // Renamed for clarity

        // Project velocity onto drone's local axes (relative to physics body orientation)
        const forwardSpeed = BABYLON.Vector3.Dot(horizontalVelocityForTilt, localForward);
        const rightSpeed = BABYLON.Vector3.Dot(horizontalVelocityForTilt, localRight);

        // --- Calculate Target Tilt (Pitch and Roll) ONLY ---
        // Yaw is handled by the physics body rotation logic above
        const targetPitch = -BABYLON.Scalar.Clamp(forwardSpeed * 0.1, -maxTiltAngle, maxTiltAngle);
        const targetRoll = BABYLON.Scalar.Clamp(rightSpeed * 0.1, -maxTiltAngle, maxTiltAngle);

        // Create target rotation quaternion from Euler angles (pitch, yaw=0, roll)
        // Yaw is 0 here because the visual node's rotation is relative to the physics body,
        // which is already handling the main yaw rotation.
        const targetTiltQuaternion = BABYLON.Quaternion.FromEulerAngles(targetPitch, 0, targetRoll);

        // Smoothly interpolate the visual drone's rotation towards the target tilt
        BABYLON.Quaternion.SlerpToRef(
            droneVisual.rotationQuaternion,
            targetTiltQuaternion, // Use the tilt-only target
            tiltLerpSpeed,        // Use original tilt lerp speed
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
    // Set components individually to avoid potential copy issues
    impostor.physicsBody.quaternion.x = rotationQuaternion.x;
    impostor.physicsBody.quaternion.y = rotationQuaternion.y;
    impostor.physicsBody.quaternion.z = rotationQuaternion.z;
    impostor.physicsBody.quaternion.w = rotationQuaternion.w;
    // impostor.physicsBody.quaternion.copy(rotationQuaternion); // Potential issue

    // Reset visual tilt
    const droneVisual = drone.getChildren().find(node => node.name === "droneVisual");
    if (droneVisual && droneVisual.rotationQuaternion) {
        droneVisual.rotationQuaternion.copyFrom(BABYLON.Quaternion.Identity());
    }

    // console.log("Drone state reset."); // Removed log
}
