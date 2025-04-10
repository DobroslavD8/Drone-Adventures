import { initializeEngine } from './core/engine.js';
import { createScene } from './core/scene.js';
import { enablePhysics } from './game/physics.js';
import { createDrone, updateDrone, resetDroneState } from './game/drone.js';
import { initializeInput } from './game/inputManager.js';
import {
    initializeBabylonGUI,
    setupMinimap,
    updateAltitudeText,
    updateSpeedText,
    updateLivesText,
    updateTimerText,
    showGameOverScreen,
    showTimeoutContinueMessage, // Import the new UI function
    updatePlayerMarker,
    addObstacleMarkerToMap // Renamed from addObstacleMarker
    // updateTargetMarker is now handled within missionManager
} from './ui/uiManager.js';
import {
    initializeMissionElements,
    setupMission,
    updateMissionLogic,
    missionTimeLimit, // Import the constant
    updateMapTargetMarker // Import the specific map target update function
} from './game/missionManager.js';

// --- PhysicsViewer is part of core BABYLON, no separate import needed ---

// --- Early Babylon.js Logger Patch ---
// Attempt to suppress specific pointer warnings if BABYLON is loaded globally
try {
    if (typeof BABYLON !== 'undefined' && BABYLON.Logger) {
        const originalWarn = BABYLON.Logger.Warn;
        const warningSubstringToSuppress = "makes sense to control ONE camera property with each pointer axis";
        BABYLON.Logger.Warn = (message) => {
            if (!(message && typeof message === 'string' && message.includes(warningSubstringToSuppress))) {
                originalWarn?.apply(BABYLON.Logger, [message]);
            }
        };
        // console.log("Applied EARLY patch to Babylon.js Logger."); // Removed log
    }
} catch (e) {
    console.error("Error during EARLY logger patch:", e);
}
// --- End Logger Patch ---


// Get the canvas element
const canvas = document.getElementById("renderCanvas");

// Check if Babylon.js and the canvas are available
if (!BABYLON || !canvas) {
    console.error("Babylon.js or canvas element not found!");
} else {
    // Wait for the DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', async () => {

        const engine = initializeEngine(canvas);
        if (!engine) return;

        // --- Global Game State ---
        const invincibilityDuration = 1.0; // Seconds
        const gameState = {
            lives: 3,
            isGameOver: false,
            invincibleTimer: 0,
            missionTimer: missionTimeLimit,
            currentMissionIndex: 0,
            isPausedForTimeout: false, // New state for timeout pause
            isMissionTransitioning: false // New state for mission completion transition
        };

        // --- Mission State ---
        const missionState = {
            stage: "pickup", // 'pickup', 'deliver', 'complete'
            hasPackage: false,
            pickupRadiusSq: 9, // 3*3
            deliveryRadiusSq: 9 // 3*3
        };

        // --- Scene and Physics Setup ---
        // Create scene first (needs engine) - Now async due to model loading
        // Note: createScene now returns { scene, camera, light, ground, obstacles, barrels }
        const sceneResult = await createScene(engine); // Added await
        if (!sceneResult) return;
        const { scene, camera, light, ground, obstacles, barrels } = sceneResult; // Destructure needed elements (added light, ground)

        // --- Drone Setup (Mesh Only) ---
        const drone = createDrone(scene); // Create drone mesh (no impostor yet)
        if (!drone) return;

        // --- Enable Physics ---
        enablePhysics(scene); // Enable physics AFTER meshes are created

        // --- Add Physics Impostors ---
        // Ground
        if (!ground.physicsImpostor) {
            ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1, friction: 0.5 }, scene);
            // console.log("Added impostor to ground."); // Removed log
        } else {
             // console.warn("Ground already had an impostor?"); // Removed log
        }


        // Static Obstacles (Buildings, Tree Trunks, Tree Leaves, Barrels)
        scene.meshes.forEach(mesh => {
            if (mesh === ground || mesh === drone || mesh.name === "skyBox" || mesh.name.startsWith("drone")) {
                // Skip ground (already done), drone physics sphere, skybox, and drone visual parts
                return;
            }

            if (!mesh.physicsImpostor) { // Only add if one doesn't exist
                let impostorType;
                let options = { mass: 0, restitution: 0.1 };

                // Check for obstacles: invisible physics boxes, trees, barrels
                if (mesh.name.endsWith("_physicsBox")) { // TARGET the invisible physics boxes
                    impostorType = BABYLON.PhysicsImpostor.BoxImpostor;
                } else if (mesh.name.includes("trunk")) {
                    impostorType = BABYLON.PhysicsImpostor.CylinderImpostor;
                } else if (mesh.name.includes("leaves")) {
                    impostorType = BABYLON.PhysicsImpostor.SphereImpostor;
                } else if (mesh.name.includes("barrel")) {
                    impostorType = BABYLON.PhysicsImpostor.CylinderImpostor;
                    options.restitution = 0.5; // Barrels are slightly bouncier
                } else {
                    // Skip other meshes like pickup/delivery markers if they exist
                    // Or add a default box impostor if needed for other static elements
                     // console.log(`Skipping impostor for mesh: ${mesh.name}`); // Removed log
                    return;
                }
                // <-- EXTRA BRACE REMOVED HERE

                // Add the impostor only if an impostorType was determined
                if (impostorType) {
                    // console.log(`Attempting to add ${impostorType} impostor to ${mesh.name}`); // REMOVED LOG
                    try {
                        // Explicitly set collision group/mask to default (collide with everything)
                        options.collisionGroup = 1;
                        options.collisionMask = -1; // Collide with all groups

                        mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, impostorType, options, scene);
                        // Check immediately if it was assigned
                        // if (mesh.physicsImpostor) {
                        //     console.log(`Successfully created impostor for ${mesh.name}.`); // REMOVED LOG
                        // } else {
                        //     console.error(`Failed to assign impostor to ${mesh.name} (returned null/undefined).`); // REMOVED LOG
                        // }
                    } catch (e) {
                         console.error(`Error during impostor creation for ${mesh.name}:`, e); // Keep error log just in case
                    }
                } else {
                     // console.log(`No impostor type determined for mesh: ${mesh.name}`); // REMOVED LOG
                }
            } else {
                 // console.log(`Mesh ${mesh.name} already has an impostor.`); // Optional log
            }
        });


        // Drone
        const droneMass = 1.0;
        const droneRestitution = 0.1;
        const droneFriction = 0.3;
        const droneOptions = {
            mass: droneMass,
            restitution: droneRestitution,
            friction: droneFriction,
            collisionGroup: 1,     // Ensure drone is in group 1
            collisionMask: -1      // Ensure drone collides with all groups
        };
        drone.physicsImpostor = new BABYLON.PhysicsImpostor(
            drone, // The physics sphere mesh
            BABYLON.PhysicsImpostor.SphereImpostor,
            droneOptions,
            scene
        );
        drone.physicsImpostor.physicsBody.angularDamping = 1.0;
        drone.physicsImpostor.physicsBody.fixedRotation = true;
        drone.physicsImpostor.physicsBody.updateMassProperties();
        // console.log("Physics impostors added."); // Removed log

        // --- Physics Debugger Removed ---


        // --- Input Setup ---
        const inputState = initializeInput(scene); // Needs scene
        if (!inputState) return;

        // --- UI Setup ---
        // Initialize Babylon GUI (needs initial game state values)
        const hudElements = initializeBabylonGUI(gameState.lives, gameState.missionTimer, "Objective: Go to Pickup"); // Pass initial values
        if (!hudElements) return;

        // Initialize HTML Minimap (needs obstacles from scene creation)
        // Define map boundaries (could be moved to uiManager if static)
        const mapConfig = {
            mapWorldMinX: -50, mapWorldMaxX: 50,
            mapWorldMinZ: -50, mapWorldMaxZ: 50,
            mapWorldWidth: 100, mapWorldDepth: 100,
            mapContainer: document.getElementById('mapContainer'), // Pass container reference
            mapWidthPx: document.getElementById('mapContainer')?.offsetWidth || 200,
            mapHeightPx: document.getElementById('mapContainer')?.offsetHeight || 150,
            playerMarker: null, // Will be created in setupMinimap
            targetMarker: null  // Will be created in setupMinimap
        };
        // Call setupMinimap which now creates markers internally and returns them
        const minimapMarkers = setupMinimap(obstacles); // Pass obstacles array for static markers
        if (minimapMarkers) {
             mapConfig.playerMarker = minimapMarkers.playerMarker; // Store reference if needed elsewhere
             mapConfig.targetMarker = minimapMarkers.targetMarker; // Store reference for update function
        }


        // --- Mission Setup ---
        const missionElements = initializeMissionElements(scene); // Needs scene
        if (!missionElements) return;

        // Setup the first mission (needs hudElements, gameState, missionState)
        setupMission(gameState.currentMissionIndex, hudElements, gameState, missionState);

        // --- Final Camera Setup ---
        camera.lockedTarget = drone; // Lock camera to the drone's physics sphere
        camera.attachControl(canvas, true); // Attach controls now that target is set

        // --- Game Reset Helper ---
        // Bundles drone and mission reset logic
        const gameResetter = {
            resetDroneState: () => resetDroneState(drone), // Pass drone ref
            // Add other reset functions if needed
        };

        // --- Collision Check Function ---
        function checkCollisions() {
            if (gameState.invincibleTimer <= 0 && !gameState.isGameOver) {
                barrels.forEach(barrel => {
                    if (drone.intersectsMesh(barrel, false)) {
                        console.log("Hit a barrel! Lives left:", gameState.lives - 1);
                        gameState.invincibleTimer = invincibilityDuration;
                        gameState.lives--;
                        updateLivesText(gameState.lives); // Update HUD

                        resetDroneState(drone); // Reset drone position/velocity

                        if (gameState.lives <= 0) {
                            gameState.isGameOver = true;
                            showGameOverScreen(true); // Show game over screen via UI Manager
                            console.log("Game Over!");
                        }
                        return; // Exit forEach early after a hit
                    }
                });
            }
        }

        // --- Full Game Reset Function ---
        function resetGame() {
            console.log("Resetting game...");
            gameState.lives = 3;
            gameState.isGameOver = false;
            gameState.invincibleTimer = invincibilityDuration; // Brief invincibility on reset
            gameState.currentMissionIndex = 0; // Reset to first mission

            resetDroneState(drone); // Reset drone position/physics

            // Reset HUD and setup mission 0
            updateLivesText(gameState.lives);
            showGameOverScreen(false); // Hide game over screen
            setupMission(0, hudElements, gameState, missionState); // Setup mission 0

            console.log("Game reset complete.");
        }


        // --- Render Loop ---
        engine.runRenderLoop(() => {
            if (!scene || !scene.isReady() || !drone || !drone.physicsImpostor) {
                return; // Wait until scene, drone, and physics are ready
            }

            const deltaTime = engine.getDeltaTime() / 1000.0;

            // 1. Handle Game Over & Restart Input
            if (gameState.isGameOver) {
                if (inputState.restart) {
                    resetGame();
                    // inputState.restart is reset inside initializeInput on keyup
                }
                scene.render(); // Still render the scene even if game over
                return; // Skip game logic updates if game is over
            }

            // NEW: Handle Timeout Pause State
            if (gameState.isPausedForTimeout) {
                if (inputState.confirmContinue) {
                    console.log("Continuing after timeout...");
                    gameState.isPausedForTimeout = false;
                    showTimeoutContinueMessage(false);
                    resetDroneState(drone); // Reset drone position/velocity
                    gameState.missionTimer = missionTimeLimit; // Reset timer
                    // inputState.confirmContinue is reset inside initializeInput on keyup
                }
                // Don't update timer or anything else while paused, just render
                scene.render();
                return; // Skip rest of game logic while paused
            }

            // 2. Update Invincibility Timer
            if (gameState.invincibleTimer > 0) {
                gameState.invincibleTimer -= deltaTime;
            }

            // 3. Update Mission Timer & Check Expiration (only if not paused or transitioning)
            if (!gameState.isPausedForTimeout && !gameState.isMissionTransitioning) {
                gameState.missionTimer -= deltaTime;
                updateTimerText(gameState.missionTimer); // Update HUD timer
            }

            // Check timer expiration ONLY if not already paused or transitioning
            if (gameState.missionTimer <= 0 && !gameState.isPausedForTimeout && !gameState.isMissionTransitioning) {
                console.log("Time ran out for mission!");
                gameState.lives--;
                updateLivesText(gameState.lives); // Update HUD lives
                gameState.invincibleTimer = invincibilityDuration; // Brief invincibility

                if (gameState.lives <= 0) {
                    gameState.isGameOver = true;
                    showGameOverScreen(true); // Show final game over
                    console.log("Game Over - Time Ran Out!");
                } else {
                    // Time ran out, but lives remain. PAUSE and prompt.
                    console.log("Time out! Pausing. Press R to continue.");
                    gameState.isPausedForTimeout = true; // Set pause flag
                    showTimeoutContinueMessage(true); // Show the message
                    // DO NOT reset drone or timer here. It happens when 'R' is pressed.
                }
            }

            // Exit loop iteration if game just ended due to timer
            if (gameState.isGameOver) {
                 scene.render();
                 return;
            }

            // 4. Update Drone (Physics, Visuals, Input)
            updateDrone(drone, inputState, scene, camera);

            // 5. Check Collisions
            checkCollisions();

             // Exit loop iteration if game just ended due to collision
            if (gameState.isGameOver) {
                 scene.render();
                 return;
            }

            // 6. Update Mission Logic
            updateMissionLogic(drone, hudElements, gameState, missionState);

            // 7. Update HUD Elements
            const dronePos = drone.getAbsolutePosition();
            const currentVelocity = drone.physicsImpostor.getLinearVelocity();
            const horizontalSpeed = Math.sqrt(currentVelocity.x * currentVelocity.x + currentVelocity.z * currentVelocity.z);
            updateAltitudeText(dronePos.y);
            updateSpeedText(horizontalSpeed);
            // Lives, Timer, Objective are updated elsewhere

            // 8. Update Minimap
            updatePlayerMarker(dronePos); // Update player position on HTML map
            // Update target marker using the mission manager function
            updateMapTargetMarker(mapConfig.targetMarker, mapConfig, gameState, missionState);


            // 9. Render the Scene
            scene.render();
        });

        // Handle window resize
        window.addEventListener("resize", () => {
            engine.resize();
            // Update map pixel dimensions on resize
            mapConfig.mapWidthPx = mapConfig.mapContainer?.offsetWidth || 200;
            mapConfig.mapHeightPx = mapConfig.mapContainer?.offsetHeight || 150;
        });

        // console.log("Drone Adventures game initialized using modules."); // Removed log

    }); // End DOMContentLoaded listener
}
