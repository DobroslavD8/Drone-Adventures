// Manages Missions, Objectives, and Progression

// --- Mission Data ---
// Note: We need access to obstacle positions (like buildings) if missions depend on them.
// For now, using hardcoded vectors based on main.js. Ideally, pass obstacle refs or positions.
const missionData = [
    { // Mission 0
        pickupPos: new BABYLON.Vector3(-23, 0.1, 23), // Moved slightly NW away from Skyscraper 6
        deliveryPos: new BABYLON.Vector3(15, 14 + 0.1, 10), // Skyscraper 1 pos + NEW height
        objectiveStart: "Objective: Go to Pickup",
        objectiveDeliver: "Objective: Deliver to Skyscraper 1"
    },
    { // Mission 1
        pickupPos: new BABYLON.Vector3(30, 0.1, -10),
        deliveryPos: new BABYLON.Vector3(-10, 14 + 0.1, -15), // Skyscraper 2 pos + NEW height
        objectiveStart: "Objective: Go to Pickup 2",
        objectiveDeliver: "Objective: Deliver to Skyscraper 2"
    },
    { // Mission 2
        pickupPos: new BABYLON.Vector3(-18, 0.1, 8), // Near tree 1
        deliveryPos: new BABYLON.Vector3(5, 14 + 0.1, 25), // Skyscraper 3 pos + NEW height
        objectiveStart: "Objective: Pickup near Tree 1",
        objectiveDeliver: "Objective: Deliver to Skyscraper 3"
    },
    { // Mission 3
        pickupPos: new BABYLON.Vector3(12, 0.1, 17), // Near barrel 1
        deliveryPos: new BABYLON.Vector3(23, 0.1, -27), // Ground near tree 2
        objectiveStart: "Objective: Pickup near Barrel 1",
        objectiveDeliver: "Objective: Deliver near Tree 2"
    },
    { // Mission 4
        pickupPos: new BABYLON.Vector3(0, 0.1, 0), // Center ground
        deliveryPos: new BABYLON.Vector3(15, 14 + 0.1, 10), // Skyscraper 1 pos + NEW height
        objectiveStart: "Objective: Pickup at Center",
        objectiveDeliver: "Objective: Deliver to Skyscraper 1 (Top)"
    },
    { // Mission 5
        pickupPos: new BABYLON.Vector3(-13, 0.1, -18), // Near building 2
        deliveryPos: new BABYLON.Vector3(-8, 0.1, -33), // Ground near tree 3
        objectiveStart: "Objective: Pickup near Building 2",
        objectiveDeliver: "Objective: Deliver near Tree 3"
    },
    { // Mission 6
        pickupPos: new BABYLON.Vector3(33, 0.1, 33), // Near tree 4
        deliveryPos: new BABYLON.Vector3(-10, 14 + 0.1, -15), // Skyscraper 2 pos + NEW height
        objectiveStart: "Objective: Pickup near Tree 4",
        objectiveDeliver: "Objective: Deliver to Skyscraper 2 (Top)"
    },
    { // Mission 7
        pickupPos: new BABYLON.Vector3(-40, 0.1, -40), // Corner
        deliveryPos: new BABYLON.Vector3(5, 14 + 0.1, 25), // Skyscraper 3 pos + NEW height
        objectiveStart: "Objective: Pickup at SW Corner",
        objectiveDeliver: "Objective: Deliver to Skyscraper 3 (Top)"
    },
    { // Mission 8
        pickupPos: new BABYLON.Vector3(40, 0.1, 40), // Opposite Corner
        deliveryPos: new BABYLON.Vector3(-7, 0.1, 23), // Ground near barrel 2
        objectiveStart: "Objective: Pickup at NE Corner",
        objectiveDeliver: "Objective: Deliver near Barrel 2"
    },
    { // Mission 9
        pickupPos: new BABYLON.Vector3(3, 0.1, -13), // Near barrel 3
        deliveryPos: new BABYLON.Vector3(0, 0.1, 0), // Center ground
        objectiveStart: "Objective: Pickup near Barrel 3",
        objectiveDeliver: "Objective: Deliver to Center"
    }
];

export const missionTimeLimit = 60.0; // Seconds per mission

// --- Mission Setup Elements ---
let pickupLocation = null;
let deliveryLocation = null;

export function initializeMissionElements(scene) {
    if (!scene) {
        console.error("Scene not provided for mission element initialization!");
        return null;
    }

    pickupLocation = BABYLON.MeshBuilder.CreateCylinder("pickup", { height: 0.2, diameter: 3 }, scene);
    const pickupMaterial = new BABYLON.StandardMaterial("pickupMat", scene);
    pickupMaterial.diffuseColor = new BABYLON.Color3(0, 1, 1); // Cyan
    pickupMaterial.alpha = 0.5; // Semi-transparent
    pickupLocation.material = pickupMaterial;

    deliveryLocation = BABYLON.MeshBuilder.CreateCylinder("delivery", { height: 0.2, diameter: 3 }, scene);
    const deliveryMaterial = new BABYLON.StandardMaterial("deliveryMat", scene);
    deliveryMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0); // Yellow
    deliveryMaterial.alpha = 0.5; // Semi-transparent
    deliveryLocation.material = deliveryMaterial;
    deliveryLocation.isVisible = false; // Hide until package is picked up

    // console.log("Mission elements (pickup/delivery markers) created."); // Removed log
    return { pickupLocation, deliveryLocation };
}

// --- Function to Setup a Specific Mission ---
export function setupMission(index, hud, gameState, missionState) {
    if (index >= missionData.length) {
        console.error("Invalid mission index:", index);
        return false; // Indicate failure
    }
    if (!pickupLocation || !deliveryLocation) {
        console.error("Mission elements not initialized before setupMission call!");
        return false;
    }
     if (!hud || !gameState || !missionState) {
        console.error("HUD, gameState, or missionState not provided to setupMission!");
        return false;
    }


    const currentMission = missionData[index];
    // console.log(`Setting up Mission ${index}`); // Removed log

    // Position pickup/delivery markers
    pickupLocation.position = currentMission.pickupPos;
    deliveryLocation.position = currentMission.deliveryPos;

    // Reset mission state for the new/current mission
    missionState.stage = "pickup";
    missionState.hasPackage = false;
    gameState.missionTimer = missionTimeLimit; // Reset timer for the new mission
    gameState.currentMissionIndex = index; // Ensure gameState knows the current index

    // Update HUD
    hud.missionObjectiveText.text = currentMission.objectiveStart;
    hud.missionObjectiveText.color = "yellow";
    hud.missionObjectiveText.isVisible = true; // Ensure it's visible
    hud.timerText.text = `Time: ${gameState.missionTimer.toFixed(1)}`;

    // Set visibility
    pickupLocation.isVisible = true;
    deliveryLocation.isVisible = false;

    return true; // Indicate success
}


// --- Mission Logic Update (called in render loop) ---
export function updateMissionLogic(drone, hud, gameState, missionState) {
    if (!drone || !hud || !gameState || !missionState || !pickupLocation || !deliveryLocation) {
        // console.warn("Missing data for mission logic update."); // Can be noisy
        return; // Exit if required data isn't available
    }
     if (gameState.isGameOver) {
        return; // Don't process mission logic if game is over
    }

    const currentMissionIndex = gameState.currentMissionIndex;
    if (currentMissionIndex >= missionData.length) {
        // All missions complete or invalid state
        return;
    }
    const currentMission = missionData[currentMissionIndex];

    if (missionState.stage === "pickup") {
        const distSq = BABYLON.Vector3.DistanceSquared(drone.getAbsolutePosition(), pickupLocation.position);
        // Check proximity and also if drone is low enough (prevents picking up while flying high over it)
        if (distSq < missionState.pickupRadiusSq && drone.getAbsolutePosition().y < pickupLocation.position.y + 1.5) { // Check y relative to pickup marker
            missionState.stage = "deliver";
            missionState.hasPackage = true; // Optional: use this later
            hud.missionObjectiveText.text = currentMission.objectiveDeliver;
            pickupLocation.isVisible = false;
            deliveryLocation.isVisible = true;
            // console.log("Package picked up!"); // Removed log
        }
    } else if (missionState.stage === "deliver") {
        const distToDeliverySq = BABYLON.Vector3.DistanceSquared(drone.getAbsolutePosition(), deliveryLocation.position);
        // Check proximity and vertical alignment (allow slightly larger vertical tolerance for landing)
        const yDifference = Math.abs(drone.getAbsolutePosition().y - deliveryLocation.position.y);
        if (distToDeliverySq < missionState.deliveryRadiusSq && yDifference < 1.5) { // Increased vertical tolerance
            missionState.stage = "complete";
            missionState.hasPackage = false;
            // console.log(`Mission ${currentMissionIndex} complete!`); // Removed log

            // Advance to next mission or end game
            gameState.currentMissionIndex++;
            if (gameState.currentMissionIndex < missionData.length) {
                hud.missionObjectiveText.text = `Mission ${currentMissionIndex} Complete! Loading next...`;
                hud.missionObjectiveText.color = "lime";
                // Delay slightly before setting up next mission
                setTimeout(() => {
                    // Re-call setupMission with the new index
                    setupMission(gameState.currentMissionIndex, hud, gameState, missionState);
                }, 1500); // 1.5 second delay
            } else {
                hud.missionObjectiveText.text = "All Missions Complete!";
                hud.missionObjectiveText.color = "gold";
                // Potentially disable controls or show final score
            }
            deliveryLocation.isVisible = false;
        }
    }
    // --- End Mission Logic ---
}

// --- Function to reset the current mission attempt (e.g., on timer fail or death) ---
// This function primarily resets the timer and drone position,
// then calls setupMission to reset the visual state for the *current* index.
export function resetCurrentMissionAttempt(drone, hud, gameState, missionState, gameResetter) {
     if (!drone || !hud || !gameState || !missionState || !gameResetter) {
        console.error("Missing arguments for resetCurrentMissionAttempt");
        return;
    }

    // console.log("Resetting current mission attempt..."); // Removed log

    // Reset timer
    gameState.missionTimer = missionTimeLimit;

    // Reset drone position and physics using the provided resetter function
    gameResetter.resetDroneState(drone);

    // Reset current mission stage (back to pickup) by re-running setup for the current index
    setupMission(gameState.currentMissionIndex, hud, gameState, missionState);
}

// --- Mini-Map Target Marker Update ---
// This function specifically handles the target marker on the minimap
export function updateMapTargetMarker(mapTargetMarker, mapConfig, gameState, missionState) {
    if (!mapTargetMarker || !mapConfig || !gameState || !missionState || !pickupLocation || !deliveryLocation) {
        // console.warn("Missing data for map target marker update.");
        if (mapTargetMarker) mapTargetMarker.style.display = 'none'; // Hide if data is missing
        return;
    }

    const { mapWorldMinX, mapWorldMinZ, mapWorldWidth, mapWorldDepth, mapWidthPx, mapHeightPx } = mapConfig;
    let targetPos = null;
    const currentMissionIndex = gameState.currentMissionIndex;

    if (currentMissionIndex < missionData.length) {
        if (missionState.stage === "pickup") {
            targetPos = pickupLocation.position;
        } else if (missionState.stage === "deliver") {
            targetPos = deliveryLocation.position;
        }
    }

    if (targetPos) {
        mapTargetMarker.style.display = 'block'; // Show marker
        const targetNormX = (targetPos.x - mapWorldMinX) / mapWorldWidth;
        const targetNormZ = (targetPos.z - mapWorldMinZ) / mapWorldDepth;
        const targetMapX = BABYLON.Scalar.Clamp(targetNormX, 0, 1) * mapWidthPx;
        const targetMapY = (1 - BABYLON.Scalar.Clamp(targetNormZ, 0, 1)) * mapHeightPx;

        // Adjust for marker size (assuming marker is centered)
        const markerWidth = parseInt(mapTargetMarker.style.width || '8px');
        const markerHeight = parseInt(mapTargetMarker.style.height || '8px');
        mapTargetMarker.style.left = `${targetMapX - markerWidth / 2}px`;
        mapTargetMarker.style.top = `${targetMapY - markerHeight / 2}px`;

    } else {
        mapTargetMarker.style.display = 'none'; // Hide marker if no target
    }
}
