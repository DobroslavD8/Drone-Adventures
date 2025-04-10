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
    updateScoreText, // Import the score update function
    showGameOverScreen,
    showTimeoutContinueMessage, // Import the new UI function
    showLeaderboard, // Import leaderboard function
    hideLeaderboard, // Import leaderboard function
    updatePlayerMarker,
    addObstacleMarkerToMap // Renamed from addObstacleMarker
    // updateTargetMarker is now handled within missionManager
} from './ui/uiManager.js';
import {
    initializeMissionElements,
    setupMission,
    updateMissionLogic,
    missionTimeLimit, // Import the constant
    updateMapTargetMarker, // Import the specific map target update function
    missionData // Import the mission data array
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

// --- Leaderboard Constants ---
const LEADERBOARD_KEY = 'droneAdventuresHighScores';
const MAX_LEADERBOARD_ENTRIES = 10; // Increased to 10

// Get the canvas element
const canvas = document.getElementById("renderCanvas");
// Get Nickname Overlay Elements
const nicknameOverlay = document.getElementById('nicknameOverlay');
const nicknameInput = document.getElementById('nicknameInput');
const startGameBtn = document.getElementById('startGameBtn');

// Check if Babylon.js and the canvas are available
if (!BABYLON || !canvas) {
    console.error("Babylon.js or canvas element not found!");
} else if (!nicknameOverlay || !nicknameInput || !startGameBtn) {
    console.error("Nickname overlay elements not found!");
} else {

    // --- Global Game State (Initialized before game start) ---
    const gameState = {
        nickname: "Guest", // Default nickname
        lives: 3,
        isGameOver: false,
        invincibleTimer: 0,
        missionTimer: missionTimeLimit,
        currentMissionIndex: 0,
        score: 0,
        isPausedForTimeout: false,
        isMissionTransitioning: false
    };

    // --- Mission State (Initialized before game start) ---
    const missionState = {
        stage: "pickup",
        hasPackage: false,
        pickupRadiusSq: 9,
        deliveryRadiusSq: 9
    };

    // --- Function to Initialize and Start the Game ---
    async function startGame(nickname) {
        gameState.nickname = nickname; // Set the actual nickname
        nicknameOverlay.style.display = 'none'; // Hide the overlay

        console.log(`Starting game for player: ${gameState.nickname}`);

        const engine = initializeEngine(canvas);
        if (!engine) return;

        // --- Constants defined within game scope ---
        const invincibilityDuration = 1.0; // Seconds

        // Reset game state values that might persist across restarts if not careful
        gameState.lives = 3;
        gameState.isGameOver = false;
        gameState.invincibleTimer = 0;
        gameState.missionTimer = missionTimeLimit;
        gameState.currentMissionIndex = 0;
        gameState.score = 0;
        gameState.isPausedForTimeout = false;
        gameState.isMissionTransitioning = false;
        missionState.stage = "pickup";
        missionState.hasPackage = false;


        // --- Scene and Physics Setup ---
        const sceneResult = await createScene(engine);
        if (!sceneResult) return;
        const { scene, camera, light, ground, obstacles, barrels } = sceneResult;

        // --- Drone Setup ---
        const drone = createDrone(scene);
        if (!drone) return;

        // --- Enable Physics ---
        enablePhysics(scene);

        // --- Add Physics Impostors ---
        if (!ground.physicsImpostor) {
            ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1, friction: 0.5 }, scene);
        }
        scene.meshes.forEach(mesh => {
            if (mesh === ground || mesh === drone || mesh.name === "skyBox" || mesh.name.startsWith("drone")) return;
            if (!mesh.physicsImpostor) {
                let impostorType;
                let options = { mass: 0, restitution: 0.1 };
                if (mesh.name.endsWith("_physicsBox")) impostorType = BABYLON.PhysicsImpostor.BoxImpostor;
                else if (mesh.name.includes("trunk")) impostorType = BABYLON.PhysicsImpostor.CylinderImpostor;
                else if (mesh.name.includes("leaves")) impostorType = BABYLON.PhysicsImpostor.SphereImpostor;
                else if (mesh.name.includes("barrel")) { impostorType = BABYLON.PhysicsImpostor.CylinderImpostor; options.restitution = 0.5; }
                else return;
                if (impostorType) {
                    try {
                        options.collisionGroup = 1; options.collisionMask = -1;
                        mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, impostorType, options, scene);
                    } catch (e) { console.error(`Error during impostor creation for ${mesh.name}:`, e); }
                }
            }
        });
        const droneMass = 1.0, droneRestitution = 0.1, droneFriction = 0.3;
        const droneOptions = { mass: droneMass, restitution: droneRestitution, friction: droneFriction, collisionGroup: 1, collisionMask: -1 };
        drone.physicsImpostor = new BABYLON.PhysicsImpostor(drone, BABYLON.PhysicsImpostor.SphereImpostor, droneOptions, scene);
        drone.physicsImpostor.physicsBody.angularDamping = 1.0;
        drone.physicsImpostor.physicsBody.fixedRotation = true;
        drone.physicsImpostor.physicsBody.updateMassProperties();

        // --- Input Setup ---
        const inputState = initializeInput(scene);
        if (!inputState) return;

        // --- UI Setup ---
        const hudElements = initializeBabylonGUI(gameState.lives, gameState.missionTimer, "Objective: Go to Pickup");
        if (!hudElements) return;
        const mapConfig = {
            mapWorldMinX: -50, mapWorldMaxX: 50, mapWorldMinZ: -50, mapWorldMaxZ: 50,
            mapWorldWidth: 100, mapWorldDepth: 100,
            mapContainer: document.getElementById('mapContainer'),
            mapWidthPx: document.getElementById('mapContainer')?.offsetWidth || 200,
            mapHeightPx: document.getElementById('mapContainer')?.offsetHeight || 150,
            playerMarker: null, targetMarker: null
        };
        const minimapMarkers = setupMinimap(obstacles);
        if (minimapMarkers) {
             mapConfig.playerMarker = minimapMarkers.playerMarker;
             mapConfig.targetMarker = minimapMarkers.targetMarker;
        }

        // --- Mission Setup ---
        const missionElements = initializeMissionElements(scene);
        if (!missionElements) return;
        setupMission(gameState.currentMissionIndex, hudElements, gameState, missionState);

        // --- Final Camera Setup ---
        camera.lockedTarget = drone;
        camera.attachControl(canvas, true);

        // --- Game Reset Helper ---
        const gameResetter = { resetDroneState: () => resetDroneState(drone) };

        // --- Collision Check Function ---
        function checkCollisions() {
            if (gameState.invincibleTimer <= 0 && !gameState.isGameOver) {
                barrels.forEach(barrel => {
                    if (drone.intersectsMesh(barrel, false)) {
                        console.log("Hit a barrel! Lives left:", gameState.lives - 1);
                        gameState.invincibleTimer = invincibilityDuration;
                        gameState.lives--;
                        updateLivesText(gameState.lives);
                        resetDroneState(drone);
                        if (gameState.lives <= 0) {
                            console.log("Game Over - Collision!");
                            handleGameOver();
                        }
                        return;
                    }
                });
            }
        }

        // --- Full Game Reset Function ---
        function resetGame() {
            console.log("Resetting game...");
            // Don't reset nickname here
            gameState.lives = 3;
            gameState.isGameOver = false;
            gameState.invincibleTimer = invincibilityDuration;
            gameState.currentMissionIndex = 0;
            gameState.score = 0;
            resetDroneState(drone);
            updateLivesText(gameState.lives);
            updateScoreText(gameState.score); // Update score display on reset
            showGameOverScreen(false);
            hideLeaderboard();
            setupMission(0, hudElements, gameState, missionState);
            console.log("Game reset complete.");
        }

        // --- Leaderboard Functions ---
        function loadHighScores() {
            try {
                const scoresJSON = localStorage.getItem(LEADERBOARD_KEY);
                if (scoresJSON) {
                    const scores = JSON.parse(scoresJSON);
                    // Ensure it's an array of {name: string, score: number} and sort descending by score
                    return scores.filter(s => typeof s === 'object' && s !== null && typeof s.name === 'string' && typeof s.score === 'number')
                                 .sort((a, b) => b.score - a.score);
                }
            } catch (e) { console.error("Error loading high scores:", e); }
            return [];
        }

        function saveHighScore(playerName, newScore) {
            if (typeof newScore !== 'number' || newScore <= 0 || typeof playerName !== 'string' || !playerName) {
                return; // Don't save invalid scores or names
            }
            const highScores = loadHighScores();
            highScores.push({ name: playerName, score: newScore });
            highScores.sort((a, b) => b.score - a.score); // Sort descending by score
            const updatedScores = highScores.slice(0, MAX_LEADERBOARD_ENTRIES); // Keep only top scores

            try {
                localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updatedScores));
            } catch (e) { console.error("Error saving high scores:", e); }
        }

        // --- Game Over Handler ---
        function handleGameOver() {
            if (gameState.isGameOver) return;
            gameState.isGameOver = true;
            console.log(`Handling Game Over for ${gameState.nickname}. Final Score: ${gameState.score}`);
            saveHighScore(gameState.nickname, gameState.score); // Save with nickname
            const finalScores = loadHighScores();
            if (finalScores.length > 0 || gameState.score > 0) {
                 showLeaderboard(finalScores); // Pass the loaded scores {name, score} array
            } else {
                 showGameOverScreen(true);
            }
        }

        // --- Render Loop ---
        engine.runRenderLoop(() => {
            if (!scene || !scene.isReady() || !drone || !drone.physicsImpostor) return;
            const deltaTime = engine.getDeltaTime() / 1000.0;

            // 1. Handle Game Over & Restart Input
            if (gameState.isGameOver) {
                if (inputState.restart) {
                    resetGame();
                }
                scene.render();
                return;
            }

            // 2. Handle Timeout Pause State
            if (gameState.isPausedForTimeout) {
                if (inputState.confirmContinue) {
                    console.log("Continuing after timeout...");
                    gameState.isPausedForTimeout = false;
                    showTimeoutContinueMessage(false);
                    resetDroneState(drone);
                    gameState.missionTimer = missionTimeLimit;
                }
                scene.render();
                return;
            }

            // 3. Update Invincibility Timer
            if (gameState.invincibleTimer > 0) gameState.invincibleTimer -= deltaTime;

            // 4. Update Mission Timer & Check Expiration
            if (!gameState.isPausedForTimeout && !gameState.isMissionTransitioning) {
                gameState.missionTimer -= deltaTime;
                updateTimerText(gameState.missionTimer);
            }
            if (gameState.missionTimer <= 0 && !gameState.isPausedForTimeout && !gameState.isMissionTransitioning) {
                console.log("Time ran out for mission!");
                gameState.lives--;
                updateLivesText(gameState.lives);
                gameState.invincibleTimer = invincibilityDuration;
                if (gameState.lives <= 0) {
                    console.log("Game Over - Time Ran Out!");
                    handleGameOver();
                } else {
                    console.log("Time out! Pausing. Press R to continue.");
                    gameState.isPausedForTimeout = true;
                    showTimeoutContinueMessage(true);
                }
            }
            if (gameState.isGameOver) { scene.render(); return; }

            // 5. Update Drone
            updateDrone(drone, inputState, scene, camera);

            // 6. Check Collisions
            checkCollisions();
            if (gameState.isGameOver) { scene.render(); return; }

            // 7. Update Mission Logic
            updateMissionLogic(drone, hudElements, gameState, missionState);
            if (gameState.currentMissionIndex >= missionData.length && !gameState.isGameOver) {
                 console.log("All missions completed!");
                 handleGameOver();
            }
            if (gameState.isGameOver) { scene.render(); return; } // Check again after mission logic

            // 8. Update HUD Elements
            const dronePos = drone.getAbsolutePosition();
            const currentVelocity = drone.physicsImpostor.getLinearVelocity();
            const horizontalSpeed = Math.sqrt(currentVelocity.x * currentVelocity.x + currentVelocity.z * currentVelocity.z);
            updateAltitudeText(dronePos.y);
            updateSpeedText(horizontalSpeed);
            updateScoreText(gameState.score);

            // 9. Update Minimap
            updatePlayerMarker(dronePos);
            updateMapTargetMarker(mapConfig.targetMarker, mapConfig, gameState, missionState);

            // 10. Render the Scene
            scene.render();
        });

        // Handle window resize
        window.addEventListener("resize", () => {
            engine.resize();
            mapConfig.mapWidthPx = mapConfig.mapContainer?.offsetWidth || 200;
            mapConfig.mapHeightPx = mapConfig.mapContainer?.offsetHeight || 150;
        });

    } // --- End startGame Function ---


    // --- Initial Setup: Add Event Listener for Nickname ---
    startGameBtn.addEventListener('click', () => {
        let nickname = nicknameInput.value.trim();
        if (!nickname) {
            nickname = "Guest"; // Default to "Guest" if empty
        }
        // Start the game only after button click
        startGame(nickname).catch(error => {
            console.error("Error starting game:", error);
            // Optionally display an error message to the user on the overlay
        });
    });

    // Allow pressing Enter in the input field to start the game
    nicknameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default form submission if applicable
            startGameBtn.click(); // Simulate button click
        }
    });

} // End initial check
