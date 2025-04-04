// Get the canvas element
const canvas = document.getElementById("renderCanvas");

// Check if Babylon.js and the canvas are available
if (!BABYLON || !canvas) {
    console.error("Babylon.js or canvas element not found!");
} else {
    // Initialize Babylon.js engine
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

    // Global game parameters
    const invincibilityDuration = 1.0; // Seconds of invincibility after hit
    const missionTimeLimit = 60.0; // Seconds per mission

    // Create the scene
    const createScene = async () => { // Make async for physics plugin
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1); // Dark background

        // Enable Physics Engine (Cannon.js)
        // Note: The global variable from the CDN is CANNON (uppercase)
        const cannonPlugin = new BABYLON.CannonJSPlugin(true, 10, CANNON);
        scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), cannonPlugin); // Enable physics with gravity

        // Create a follow camera
        const camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -10), scene);
        camera.radius = 15; // Distance from the target
        camera.heightOffset = 4; // Height above the target
        camera.rotationOffset = 0; // Angle around the target (0 = directly behind)
        camera.cameraAcceleration = 0.05; // How fast the camera moves to follow
        camera.maxCameraSpeed = 10; // Max speed of the camera
        // Adjust camera sensitivity for smoother mouse control
        camera.angularSensibilityX = 500; // Default is 2000, lower is less sensitive
        camera.angularSensibilityY = 500; // Default is 2000, lower is less sensitive
        // camera.attachControl(canvas, true); // Attach control later, only after locking the target

        // Create a light
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        // Create a ground plane
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
        const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
        // groundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.6, 0.5); // Greenish ground
        // Use a basic grass-like texture color
        groundMaterial.diffuseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/grass.png", scene);
        groundMaterial.diffuseTexture.uScale = 10; // Repeat texture
        groundMaterial.diffuseTexture.vScale = 10;
        groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Less shiny
        ground.material = groundMaterial;
        ground.receiveShadows = true; // Allow shadows on the ground
        // Add physics impostor to the ground (static)
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1, friction: 0.5 }, scene);


        // Add some simple obstacles (Buildings)
        const buildingMaterial = new BABYLON.StandardMaterial("buildingMat", scene);
        // Use a basic concrete/brick-like texture color
        buildingMaterial.diffuseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/bricktile.jpg", scene);
        buildingMaterial.diffuseTexture.uScale = 2;
        buildingMaterial.diffuseTexture.vScale = 4;
        buildingMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

        const box1 = BABYLON.MeshBuilder.CreateBox("building1", { size: 5, height: 10 }, scene);
        box1.position = new BABYLON.Vector3(15, 5, 10);
        box1.material = buildingMaterial; // Apply building material
        box1.receiveShadows = true;
        // Add physics impostor (static)
        box1.physicsImpostor = new BABYLON.PhysicsImpostor(box1, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1 }, scene);


        const box2 = BABYLON.MeshBuilder.CreateBox("building2", { width: 4, depth: 4, height: 15 }, scene);
        box2.position = new BABYLON.Vector3(-10, 7.5, -15);
        box2.material = buildingMaterial; // Apply building material
        box2.receiveShadows = true;
        // Add physics impostor (static)
        box2.physicsImpostor = new BABYLON.PhysicsImpostor(box2, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1 }, scene);


        const box3 = BABYLON.MeshBuilder.CreateBox("building3", { size: 8, height: 8 }, scene);
        box3.position = new BABYLON.Vector3(5, 4, 25);
        box3.material = buildingMaterial; // Apply building material
        box3.receiveShadows = true;
        // Add physics impostor (static)
        box3.physicsImpostor = new BABYLON.PhysicsImpostor(box3, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1 }, scene);


        // --- Add Trees ---
        const treeMaterialTrunk = new BABYLON.StandardMaterial("treeTrunkMat", scene);
        treeMaterialTrunk.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.1); // Brown
        const treeMaterialLeaves = new BABYLON.StandardMaterial("treeLeavesMat", scene);
        treeMaterialLeaves.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.2); // Dark Green

        const createTree = (name, position) => {
            const trunk = BABYLON.MeshBuilder.CreateCylinder(`${name}_trunk`, { height: 4, diameter: 0.8 }, scene);
            trunk.material = treeMaterialTrunk;
            trunk.position = position.clone();
            trunk.position.y += 2; // Base at ground level
            trunk.physicsImpostor = new BABYLON.PhysicsImpostor(trunk, BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 0, restitution: 0.1 }, scene);

            const leaves = BABYLON.MeshBuilder.CreateSphere(`${name}_leaves`, { diameter: 3 }, scene);
            leaves.material = treeMaterialLeaves;
            leaves.position = position.clone();
            leaves.position.y += 4.5; // Position above trunk
            // Optional: Add impostor to leaves too, or make trunk taller
            leaves.physicsImpostor = new BABYLON.PhysicsImpostor(leaves, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 0, restitution: 0.1 }, scene);
        };

        createTree("tree1", new BABYLON.Vector3(-15, 0, 5));
        createTree("tree2", new BABYLON.Vector3(20, 0, -25));
        createTree("tree3", new BABYLON.Vector3(-5, 0, -30));
        createTree("tree4", new BABYLON.Vector3(30, 0, 30));


        // --- Add Barrels (Hazards) ---
        const barrelMaterial = new BABYLON.StandardMaterial("barrelMat", scene);
        barrelMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.1, 0.1); // Red
        const barrels = []; // Keep track of barrels for collision checks
        const createBarrel = (name, position) => {
            const barrel = BABYLON.MeshBuilder.CreateCylinder(name, { height: 2.0, diameter: 1.5 }, scene); // Increased size
            barrel.material = barrelMaterial;
            barrel.position = position.clone();
            barrel.position.y += 0.75; // Base at ground level
            barrel.physicsImpostor = new BABYLON.PhysicsImpostor(barrel, BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 0, restitution: 0.5 }, scene);
            barrel.metadata = { type: "barrel" }; // Add metadata for collision identification
            barrels.push(barrel);
        };

        createBarrel("barrel1", new BABYLON.Vector3(10, 0, 15));
        createBarrel("barrel2", new BABYLON.Vector3(-5, 0, 20));
        createBarrel("barrel3", new BABYLON.Vector3(0, 0, -10));
        // --- End Barrels ---


        // --- Drone Setup ---
        // Physics Sphere (invisible, handles collisions and movement)
        const droneMass = 1.0;
        const droneRestitution = 0.1;
        const droneFriction = 0.3;
        const physicsSphere = BABYLON.MeshBuilder.CreateSphere("dronePhysicsSphere", { diameter: 1 }, scene);
        physicsSphere.position = new BABYLON.Vector3(0, 5, 0); // Start higher
        physicsSphere.isVisible = false; // Make the physics sphere invisible

        // Add physics impostor (dynamic) to the invisible sphere
        physicsSphere.physicsImpostor = new BABYLON.PhysicsImpostor(
            physicsSphere,
            BABYLON.PhysicsImpostor.SphereImpostor,
            { mass: droneMass, restitution: droneRestitution, friction: droneFriction },
            scene
        );
        // Prevent drone from rotating due to physics collisions
        physicsSphere.physicsImpostor.physicsBody.angularDamping = 1.0;
        physicsSphere.physicsImpostor.physicsBody.fixedRotation = true;
        physicsSphere.physicsImpostor.physicsBody.updateMassProperties();

        // Visual Drone Mesh (Parented to the physics sphere)
        const droneVisual = new BABYLON.TransformNode("droneVisual", scene);
        droneVisual.parent = physicsSphere; // Attach visual part to physics sphere

        const body = BABYLON.MeshBuilder.CreateBox("droneBody", { width: 0.8, height: 0.2, depth: 1.2 }, scene); // Longer depth indicates front
        body.material = new BABYLON.StandardMaterial("droneMat", scene);
        body.material.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.4); // Dark grey
        body.parent = droneVisual;

        // Simple rotors (adjust positions as needed)
        const rotorMaterial = new BABYLON.StandardMaterial("rotorMat", scene);
        rotorMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Black rotors
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

        // Camera targets the physics sphere (which carries the visual mesh)
        camera.lockedTarget = physicsSphere;
        camera.attachControl(canvas, true);

        // Input state object
        const inputState = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            rotateLeft: false, // Q
            rotateRight: false, // E
            restart: false // R - Added for restart
        };

        // Keyboard event listeners
        scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key.toLowerCase()) {
                        case "w": inputState.forward = true; break;
                        case "r":
                            console.log("R key pressed (KEYDOWN)"); // Log R press
                            inputState.restart = true;
                            break;
                        case "s": inputState.backward = true; break;
                        case "a": inputState.left = true; break; // Strafe left
                        case "d": inputState.right = true; break; // Strafe right
                        case "q": inputState.rotateLeft = true; break; // Rotate left
                        case "e": inputState.rotateRight = true; break; // Rotate right
                        case " ": inputState.up = true; break; // Ascend
                        case "shift": inputState.down = true; break; // Descend
                    }
                    break;
                case BABYLON.KeyboardEventTypes.KEYUP:
                    switch (kbInfo.event.key.toLowerCase()) {
                        case "w": inputState.forward = false; break;
                        // ... existing keyup cases ...
                        case "r": inputState.restart = false; break; // Reset restart flag on key up
                        case "s": inputState.backward = false; break;
                        case "a": inputState.left = false; break;
                        case "d": inputState.right = false; break;
                        case "q": inputState.rotateLeft = false; break;
                        case "e": inputState.rotateRight = false; break;
                        case " ": inputState.up = false; break;
                        case "shift": inputState.down = false; break;
                    }
                    break;
            }
        });

        // --- GUI / HUD Setup ---
        const adt = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        const hudPanel = new BABYLON.GUI.StackPanel();
        hudPanel.width = "250px"; // Increased width for longer text
        hudPanel.isVertical = true;
        hudPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        hudPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        hudPanel.paddingTop = "10px";
        hudPanel.paddingLeft = "10px";
        adt.addControl(hudPanel);

        const altitudeText = new BABYLON.GUI.TextBlock("altitudeText", "Altitude: 0.0 m");
        altitudeText.height = "30px";
        altitudeText.color = "white";
        altitudeText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        hudPanel.addControl(altitudeText);

        const speedText = new BABYLON.GUI.TextBlock("speedText", "Speed: 0.0 m/s");
        speedText.height = "30px";
        speedText.color = "white";
        speedText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        hudPanel.addControl(speedText);

        const missionObjectiveText = new BABYLON.GUI.TextBlock("missionObjectiveText", "Objective: Go to Pickup");
        missionObjectiveText.height = "30px";
        missionObjectiveText.color = "yellow";
        missionObjectiveText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        hudPanel.addControl(missionObjectiveText);

        const livesText = new BABYLON.GUI.TextBlock("livesText", "Lives: 3");
        livesText.height = "30px";
        livesText.color = "red";
        livesText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        hudPanel.addControl(livesText);

        const timerText = new BABYLON.GUI.TextBlock("timerText", `Time: ${missionTimeLimit.toFixed(1)}`);
        timerText.height = "30px";
        timerText.color = "lightblue";
        timerText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        hudPanel.addControl(timerText);


        // --- Game Over Text (Initially Hidden) ---
        const gameOverText = new BABYLON.GUI.TextBlock("gameOverText", "GAME OVER\nPress R to Restart");
        gameOverText.color = "red";
        gameOverText.fontSize = 48;
        gameOverText.fontWeight = "bold";
        gameOverText.textWrapping = true;
        gameOverText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        gameOverText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        gameOverText.isVisible = false; // Hide initially
        adt.addControl(gameOverText);


        // --- Controls Legend ---
        const controlsPanel = new BABYLON.GUI.StackPanel();
        controlsPanel.width = "220px";
        controlsPanel.isVertical = true;
        controlsPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        controlsPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        controlsPanel.paddingTop = "10px";
        controlsPanel.paddingRight = "10px";
        adt.addControl(controlsPanel);

        const controlsTitle = new BABYLON.GUI.TextBlock("controlsTitle", "Controls:");
        controlsTitle.height = "25px";
        controlsTitle.color = "white";
        controlsTitle.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        controlsPanel.addControl(controlsTitle);

        const controlsText = new BABYLON.GUI.TextBlock("controlsText",
            "Move: WASD\n" +
            "Ascend: Space\n" +
            "Descend: Shift\n" +
            "Rotate: Q / E\n" +
            "Look: Mouse\n" +
            "Restart (Game Over): R" // Added Restart info
        );
        controlsText.height = "120px"; // Adjust height as needed
        controlsText.color = "white";
        controlsText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        controlsText.textWrapping = true;
        controlsPanel.addControl(controlsText);


        // --- Mission Data ---
        const missionData = [
            { // Mission 0
                pickupPos: new BABYLON.Vector3(-20, 0.1, 20),
                deliveryPos: box1.position.clone().add(new BABYLON.Vector3(0, box1.getBoundingInfo().boundingBox.maximumWorld.y - box1.position.y + 0.1, 0)), // On box1
                objectiveStart: "Objective: Go to Pickup",
                objectiveDeliver: "Objective: Deliver to Building 1"
            },
            { // Mission 1
                pickupPos: new BABYLON.Vector3(30, 0.1, -10),
                deliveryPos: box2.position.clone().add(new BABYLON.Vector3(0, box2.getBoundingInfo().boundingBox.maximumWorld.y - box2.position.y + 0.1, 0)), // On box2
                objectiveStart: "Objective: Go to Pickup 2",
                objectiveDeliver: "Objective: Deliver to Building 2"
            }
            // Add more missions here
        ];

        // --- Mission Setup Elements (will be positioned by setupMission) ---
        const pickupLocation = BABYLON.MeshBuilder.CreateCylinder("pickup", { height: 0.2, diameter: 3 }, scene);
        const pickupMaterial = new BABYLON.StandardMaterial("pickupMat", scene);
        pickupMaterial.diffuseColor = new BABYLON.Color3(0, 1, 1); // Cyan
        pickupMaterial.alpha = 0.5; // Semi-transparent
        pickupLocation.material = pickupMaterial;

        const deliveryLocation = BABYLON.MeshBuilder.CreateCylinder("delivery", { height: 0.2, diameter: 3 }, scene);
        const deliveryMaterial = new BABYLON.StandardMaterial("deliveryMat", scene);
        deliveryMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0); // Yellow
        deliveryMaterial.alpha = 0.5; // Semi-transparent
        deliveryLocation.material = deliveryMaterial;
        deliveryLocation.isVisible = false; // Hide until package is picked up


        // Store references
        scene.userData = {
            drone: physicsSphere,
            droneVisual: droneVisual,
            input: inputState,
            hud: { altitudeText, speedText, missionObjectiveText, livesText, gameOverText, timerText }, // Added timerText
            barrels: barrels, // Store barrel array
            missionData: missionData, // Store mission definitions
            gameState: {
                lives: 3,
                isGameOver: false,
                invincibleTimer: 0,
                missionTimer: missionTimeLimit,
                currentMissionIndex: 0
            },
            missionElements: { // Store references to the meshes
                pickupLocation,
                deliveryLocation,
            },
            missionState: { // Current mission runtime state
                stage: "pickup", // 'pickup', 'deliver', 'complete'
                hasPackage: false,
                pickupRadiusSq: 9,
                deliveryRadiusSq: 9
            }
        };

        // Initial mission setup
        setupMission(scene.userData.gameState.currentMissionIndex, scene.userData);

        return scene;
    };

    // Create the scene (now async)
    createScene().then(scene => {

        // Drone control parameters (adjust as needed)
        const moveForceMagnitude = 22;
        const verticalForceMagnitude = 25;
        const rotationSpeed = 1.5;
        const stabilizationForceFactor = 2.0;

        // Define Play Area Boundaries
        const playAreaMinX = -49;
        const playAreaMaxX = 49;
        const playAreaMinZ = -49;
        const playAreaMaxZ = 49;


        // Run the render loop
        engine.runRenderLoop(() => {
            if (scene && scene.isReady() && scene.userData) {
                const deltaTime = engine.getDeltaTime() / 1000.0;
            const { drone, input, hud, missionState, missionElements, missionData, barrels, gameState } = scene.userData;
            const impostor = drone.physicsImpostor;

            // Update invincibility timer
            if (gameState.invincibleTimer > 0) {
                gameState.invincibleTimer -= deltaTime;
            }

            // Check for restart input FIRST, even if game is over
            if (gameState.isGameOver && input.restart) {
                 console.log("Restart condition met. Calling resetGame...");
                 resetGame(scene.userData); // Reset game completely
                 input.restart = false;
                 // resetGame sets isGameOver to false, loop continues
            }

            // Update Timer
            if (!gameState.isGameOver) {
                gameState.missionTimer -= deltaTime;
                hud.timerText.text = `Time: ${Math.max(0, gameState.missionTimer).toFixed(1)}`;

                // Check Timer Expiration
                if (gameState.missionTimer <= 0) {
                    console.log("Time ran out!");
                    gameState.lives--;
                    hud.livesText.text = `Lives: ${gameState.lives}`;
                    gameState.invincibleTimer = invincibilityDuration; // Brief invincibility

                    if (gameState.lives <= 0) {
                        gameState.isGameOver = true;
                        hud.gameOverText.isVisible = true;
                        hud.missionObjectiveText.isVisible = false;
                        console.log("Game Over!");
                    } else {
                        // Time ran out, but lives remain. Reset timer and drone position, but NOT mission stage.
                        console.log("Time out! Resetting timer and position for current mission.");
                        gameState.missionTimer = missionTimeLimit; // Reset timer

                        // Reset drone position and physics to safe spot
                        const respawnPosition = new BABYLON.Vector3(0, 15, -20);
                        drone.position.copyFrom(respawnPosition);
                        drone.rotation = BABYLON.Vector3.Zero();
                        if (drone.rotationQuaternion) {
                            drone.rotationQuaternion.copyFrom(BABYLON.Quaternion.Identity());
                        }
                        if (impostor) {
                            impostor.setLinearVelocity(BABYLON.Vector3.Zero());
                            impostor.setAngularVelocity(BABYLON.Vector3.Zero());
                        }
                        // DO NOT reset missionState.stage here
                    }
                }
            }


            // Now exit if physics not ready OR if game is still over
            if (!impostor || gameState.isGameOver) {
                return;
            }


            // --- Drone Physics Control Logic ---

                // Get the active camera
                const camera = scene.activeCamera;
                if (!camera) return; // Exit if no camera

                // Calculate camera's forward and right vectors projected onto the horizontal plane
                const cameraForward = camera.getForwardRay().direction;
                const cameraRight = BABYLON.Vector3.Cross(camera.upVector, cameraForward); // Calculate right vector

                // Project onto horizontal plane (ignore Y component) and normalize
                const forwardDir = new BABYLON.Vector3(cameraForward.x, 0, cameraForward.z).normalize();
                const rightDir = new BABYLON.Vector3(cameraRight.x, 0, cameraRight.z).normalize();

                // Horizontal Movement Force (based on camera direction)
                let moveForce = BABYLON.Vector3.Zero();
                if (input.forward) moveForce.addInPlace(forwardDir);
                if (input.backward) moveForce.subtractInPlace(forwardDir);
                if (input.left) moveForce.subtractInPlace(rightDir); // Strafe left relative to camera
                if (input.right) moveForce.addInPlace(rightDir); // Strafe right relative to camera
                // Removed the redundant drone-relative force additions here

                if (moveForce.lengthSquared() > 0) {
                    moveForce.normalize().scaleInPlace(moveForceMagnitude);
                }

                // Vertical Movement Force (needs to counteract gravity)
                let verticalForce = BABYLON.Vector3.Zero();
                const currentYVelocity = impostor.getLinearVelocity().y;
                const gravityCompensation = 9.81 * impostor.mass; // Force needed to just hover

                if (input.up) {
                    verticalForce.y = verticalForceMagnitude + gravityCompensation;
                } else if (input.down) {
                    verticalForce.y = -verticalForceMagnitude + gravityCompensation; // Still apply some upward force to slow descent
                } else {
                    // Apply stabilization force to hover (counteract gravity and current vertical velocity)
                    verticalForce.y = gravityCompensation - (currentYVelocity * stabilizationForceFactor);
                }

                // Apply combined forces at the center of the drone
                impostor.applyForce(moveForce.add(verticalForce), drone.getAbsolutePosition());

                // Apply stabilization/damping force against horizontal movement when no input
                 if (moveForce.lengthSquared() === 0) {
                    const currentHorizontalVelocity = impostor.getLinearVelocity().clone();
                    currentHorizontalVelocity.y = 0; // Ignore vertical component
                    const stabilizationForce = currentHorizontalVelocity.scale(-stabilizationForceFactor); // Force opposite to current velocity
                    impostor.applyForce(stabilizationForce, drone.getAbsolutePosition());
                }


                // Manual Rotation (Yaw) - Applied to the physics sphere's rotation directly
                let rotationChange = 0;
                if (input.rotateLeft) rotationChange -= rotationSpeed * deltaTime;
                if (input.rotateRight) rotationChange += rotationSpeed * deltaTime;

                // Apply rotation change to the physics sphere. The visual mesh will follow due to parenting.
                if (rotationChange !== 0) {
                    // We need to rotate the physics sphere itself, as its orientation dictates the 'forward' direction
                    drone.rotation.y += rotationChange;
                    // Ensure the physics body's orientation is updated if fixedRotation allows manual changes (it should)
                    // This might not be strictly necessary if fixedRotation=true truly fixes it, but let's be safe.
                    // Note: Cannon.js uses Quaternions. We need to convert Euler Y rotation to Quaternion.
                    const currentQuaternion = drone.physicsImpostor.physicsBody.quaternion;
                    const rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, drone.rotation.y, 0);
                    drone.physicsImpostor.physicsBody.quaternion.copy(rotationQuaternion);

                }

                // --- Boundary Checks ---
                // Clamp position after physics update
                const currentPosition = drone.getAbsolutePosition();
                let clamped = false;
                if (currentPosition.x < playAreaMinX) { drone.position.x = playAreaMinX; clamped = true; }
                if (currentPosition.x > playAreaMaxX) { drone.position.x = playAreaMaxX; clamped = true; }
                if (currentPosition.z < playAreaMinZ) { drone.position.z = playAreaMinZ; clamped = true; }
                if (currentPosition.z > playAreaMaxZ) { drone.position.z = playAreaMaxZ; clamped = true; }

                // If position was clamped, optionally zero out velocity in that direction
                if (clamped && impostor.getLinearVelocity()) {
                    const velocity = impostor.getLinearVelocity();
                    if (currentPosition.x <= playAreaMinX || currentPosition.x >= playAreaMaxX) {
                       impostor.setLinearVelocity(new BABYLON.Vector3(0, velocity.y, velocity.z));
                    }
                    if (currentPosition.z <= playAreaMinZ || currentPosition.z >= playAreaMaxZ) {
                       impostor.setLinearVelocity(new BABYLON.Vector3(velocity.x, velocity.y, 0));
                    }
                }
                // --- End Boundary Checks ---


                // --- End Drone Physics Control Logic ---

            // --- Collision Logic ---
            // Barrel Collision Check (only if not invincible)
            if (gameState.invincibleTimer <= 0) {
                barrels.forEach(barrel => {
                    if (drone.intersectsMesh(barrel, false)) {
                        console.log("Hit a barrel! Lives left:", gameState.lives - 1);
                        gameState.invincibleTimer = invincibilityDuration; // Start invincibility FIRST
                        gameState.lives--;
                        hud.livesText.text = `Lives: ${gameState.lives}`;

                    // Reset drone position to safe spot
                    const respawnPosition = new BABYLON.Vector3(0, 15, -20);
                    drone.position.copyFrom(respawnPosition); // Set mesh position
                    drone.rotation = BABYLON.Vector3.Zero(); // Reset mesh rotation
                    if (drone.rotationQuaternion) { // Reset quaternion too if exists
                         drone.rotationQuaternion.copyFrom(BABYLON.Quaternion.Identity());
                    }
                    if (impostor) {
                        // Zero out velocities AFTER setting position/rotation
                        impostor.setLinearVelocity(BABYLON.Vector3.Zero());
                        impostor.setAngularVelocity(BABYLON.Vector3.Zero());
                    }


                    // Remove the hit barrel (or could just respawn drone)
                    // barrel.dispose(); // For now, let's just reset position

                        if (gameState.lives <= 0) {
                            gameState.isGameOver = true;
                            hud.gameOverText.isVisible = true; // Show game over text
                            // hud.missionObjectiveText.text = "GAME OVER - Press R to Restart"; // Remove this line
                            // hud.missionObjectiveText.color = "red"; // Keep objective text as is or hide it
                            hud.missionObjectiveText.isVisible = false; // Hide objective text on game over
                            console.log("Game Over!");
                            // Optionally stop engine, etc.
                        }
                        // Break loop after first hit in a frame if needed, though invincibility handles it
                        return; // Exit forEach early after a hit
                    }
                });
            }


            // --- Mission Logic ---
            if (missionState.stage === "pickup") {
                const distSq = BABYLON.Vector3.DistanceSquared(drone.getAbsolutePosition(), missionElements.pickupLocation.position);
                if (distSq < missionState.pickupRadiusSq && drone.getAbsolutePosition().y < 1.5) {
                    missionState.stage = "deliver";
                    missionState.hasPackage = true; // Optional: use this later
                    hud.missionObjectiveText.text = missionData[gameState.currentMissionIndex].objectiveDeliver;
                    missionElements.pickupLocation.isVisible = false;
                    missionElements.deliveryLocation.isVisible = true;
                }
            } else if (missionState.stage === "deliver") {
                const distToDeliverySq = BABYLON.Vector3.DistanceSquared(drone.getAbsolutePosition(), missionElements.deliveryLocation.position);
                const yDifference = Math.abs(drone.getAbsolutePosition().y - missionElements.deliveryLocation.position.y);
                if (distToDeliverySq < missionState.deliveryRadiusSq && yDifference < 1.0) {
                    missionState.stage = "complete";
                    missionState.hasPackage = false;
                    console.log(`Mission ${gameState.currentMissionIndex} complete!`);

                    // Advance to next mission or end game
                    gameState.currentMissionIndex++;
                    if (gameState.currentMissionIndex < missionData.length) {
                        hud.missionObjectiveText.text = `Mission ${gameState.currentMissionIndex} Complete! Loading next...`;
                        hud.missionObjectiveText.color = "lime";
                        // Delay slightly before setting up next mission
                        setTimeout(() => {
                             setupMission(gameState.currentMissionIndex, scene.userData);
                        }, 1500); // 1.5 second delay
                    } else {
                        hud.missionObjectiveText.text = "All Missions Complete!";
                        hud.missionObjectiveText.color = "gold";
                        // Potentially disable controls or show final score
                    }
                    missionElements.deliveryLocation.isVisible = false;
                }
            }
            // --- End Mission Logic ---


            // --- Update HUD ---
            const currentVelocity = impostor.getLinearVelocity();
            const currentSpeed = Math.sqrt(currentVelocity.x * currentVelocity.x + currentVelocity.z * currentVelocity.z); // Horizontal speed
            const currentAltitude = drone.getAbsolutePosition().y; // Altitude from world origin (adjust if ground isn't at y=0)
            hud.altitudeText.text = `Altitude: ${currentAltitude.toFixed(1)} m`;
            hud.speedText.text = `Speed: ${currentSpeed.toFixed(1)} m/s`;
            // Mission objective text is updated within mission logic

            // --- End Update HUD ---


            scene.render();
        }
    });

    // Handle window resize
    window.addEventListener("resize", () => {
        engine.resize();
    });

    console.log("Babylon.js scene initialized with physics.");

    }).catch(error => {
        console.error("Failed to create scene:", error);
    });

    // --- Game Reset Function ---
    function resetGame(userData) {
        const { drone, hud, mission, gameState } = userData;
        const impostor = drone.physicsImpostor;

        console.log("Resetting game...");

        // Reset Game State
        gameState.lives = 3; // Ensure lives are reset to 3
        gameState.isGameOver = false;
        gameState.invincibleTimer = invincibilityDuration; // Start with brief invincibility on reset

        // Reset Drone Physics and Position
        if (impostor) {
            impostor.setLinearVelocity(BABYLON.Vector3.Zero());
            impostor.setAngularVelocity(BABYLON.Vector3.Zero());
        }
        const respawnPosition = new BABYLON.Vector3(0, 15, -20); // Define respawn point

        // Update mesh position and rotation
        drone.position.copyFrom(respawnPosition);
        drone.rotation = BABYLON.Vector3.Zero(); // Reset Euler rotation
        // Also reset rotation quaternion if it's used (might not be necessary with fixedRotation=true, but safe)
        if (drone.rotationQuaternion) {
            drone.rotationQuaternion.copyFrom(BABYLON.Quaternion.Identity());
        }

        // Zero out physics velocities AFTER setting position/rotation
        if (impostor) {
             impostor.setLinearVelocity(BABYLON.Vector3.Zero());
             impostor.setAngularVelocity(BABYLON.Vector3.Zero());
             // The physics engine should sync the body to the mesh transform on the next step
        }


        // Reset Mission State
        mission.stage = "pickup";
        mission.hasPackage = false;
        mission.pickupLocation.isVisible = true;
        mission.deliveryLocation.isVisible = false;

        // Reset HUD for the first mission
        setupMission(0, userData); // Setup mission 0 state
        hud.livesText.text = `Lives: ${gameState.lives}`;
        hud.gameOverText.isVisible = false;
    }

    // --- Function to reset the current mission attempt (e.g., on timer fail) ---
    function resetCurrentMission(userData) {
        const { drone, gameState, impostor } = userData;

        console.log("Resetting current mission attempt...");

        // Reset timer
        gameState.missionTimer = missionTimeLimit;

        // Reset drone position and physics
        const respawnPosition = new BABYLON.Vector3(0, 15, -20);
        drone.position.copyFrom(respawnPosition); // Set mesh position
        drone.rotation = BABYLON.Vector3.Zero(); // Reset mesh rotation
        if (drone.rotationQuaternion) { // Reset quaternion too if exists
             drone.rotationQuaternion.copyFrom(BABYLON.Quaternion.Identity());
        }
        if (impostor) {
            // Zero out velocities AFTER setting position/rotation
            impostor.setLinearVelocity(BABYLON.Vector3.Zero());
            impostor.setAngularVelocity(BABYLON.Vector3.Zero());
        }

        // Reset current mission stage (back to pickup)
        setupMission(gameState.currentMissionIndex, userData); // Re-setup current mission visuals/state
    }


    // --- Function to Setup a Specific Mission ---
    function setupMission(index, userData) {
        const { hud, missionElements, missionData, gameState, missionState } = userData;

        if (index >= missionData.length) {
            console.error("Invalid mission index:", index);
            return;
        }

        const currentMission = missionData[index];
        console.log(`Setting up Mission ${index}`);

        // Position pickup/delivery markers
        missionElements.pickupLocation.position = currentMission.pickupPos;
        missionElements.deliveryLocation.position = currentMission.deliveryPos;

        // Reset mission state
        missionState.stage = "pickup";
        missionState.hasPackage = false;
        gameState.missionTimer = missionTimeLimit; // Reset timer for the new mission

        // Update HUD
        hud.missionObjectiveText.text = currentMission.objectiveStart;
        hud.missionObjectiveText.color = "yellow";
        hud.missionObjectiveText.isVisible = true;
        hud.timerText.text = `Time: ${gameState.missionTimer.toFixed(1)}`;

        // Set visibility
        missionElements.pickupLocation.isVisible = true;
        missionElements.deliveryLocation.isVisible = false;
    }

}
