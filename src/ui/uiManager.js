let mapContainer, playerMarker, targetMarker;
let mapWorldMinX, mapWorldMaxX, mapWorldMinZ, mapWorldMaxZ;
let mapWorldWidth, mapWorldDepth;
let mapWidthPx, mapHeightPx;

// Store references to Babylon GUI elements
let adt, altitudeText, speedText, missionObjectiveText, livesText, timerText, gameOverText, timeoutContinueText, controlsPanel;


// --- Babylon.js GUI Setup ---
export function initializeBabylonGUI(initialLives, initialTime, initialObjective) {
    adt = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    const hudPanel = new BABYLON.GUI.StackPanel();
    hudPanel.width = "250px"; // Increased width for longer text
    hudPanel.isVertical = true;
    hudPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    hudPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    hudPanel.paddingTop = "10px";
    hudPanel.paddingLeft = "10px";
    adt.addControl(hudPanel);

    altitudeText = new BABYLON.GUI.TextBlock("altitudeText", "Altitude: 0.0 m");
    altitudeText.height = "30px";
    altitudeText.color = "white";
    altitudeText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    hudPanel.addControl(altitudeText);

    speedText = new BABYLON.GUI.TextBlock("speedText", "Speed: 0.0 m/s");
    speedText.height = "30px";
    speedText.color = "white";
    speedText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    hudPanel.addControl(speedText);

    missionObjectiveText = new BABYLON.GUI.TextBlock("missionObjectiveText", initialObjective || "Objective: ---");
    missionObjectiveText.height = "30px";
    missionObjectiveText.color = "yellow";
    missionObjectiveText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    hudPanel.addControl(missionObjectiveText);

    livesText = new BABYLON.GUI.TextBlock("livesText", `Lives: ${initialLives || 3}`);
    livesText.height = "30px";
    livesText.color = "red";
    livesText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    hudPanel.addControl(livesText);

    timerText = new BABYLON.GUI.TextBlock("timerText", `Time: ${initialTime?.toFixed(1) || '0.0'}`);
    timerText.height = "30px";
    timerText.color = "lightblue";
    timerText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    hudPanel.addControl(timerText);


    // --- Game Over Text (Initially Hidden) ---
    gameOverText = new BABYLON.GUI.TextBlock("gameOverText", "GAME OVER\nPress R to Restart");
    gameOverText.color = "red";
    gameOverText.fontSize = 48;
    gameOverText.fontWeight = "bold";
    gameOverText.textWrapping = true;
    gameOverText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    gameOverText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    gameOverText.isVisible = false; // Hide initially
    adt.addControl(gameOverText);

    // --- Timeout Continue Text (Initially Hidden) ---
    timeoutContinueText = new BABYLON.GUI.TextBlock("timeoutContinueText", "Time Out!\nPress R to Continue");
    timeoutContinueText.color = "orange";
    timeoutContinueText.fontSize = 40;
    timeoutContinueText.fontWeight = "bold";
    timeoutContinueText.textWrapping = true;
    timeoutContinueText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    timeoutContinueText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    timeoutContinueText.isVisible = false; // Hide initially
    adt.addControl(timeoutContinueText);


    // --- Controls Legend ---
    controlsPanel = new BABYLON.GUI.StackPanel();
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

    // console.log("Babylon.js GUI initialized."); // Removed log

    // Return references to the created elements
    return {
        adt,
        altitudeText,
        speedText,
        missionObjectiveText,
        livesText,
        timerText,
        gameOverText,
        timeoutContinueText, // Export the new text block
        controlsPanel
    };
}


// --- HTML Minimap Setup ---
export function setupMinimap(obstacles) {
    mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) {
        console.error("Minimap container 'mapContainer' not found!");
        return;
    }

    
    playerMarker = document.createElement('div');
    playerMarker.style.position = 'absolute';
    playerMarker.style.width = '8px';
    playerMarker.style.height = '8px';
    playerMarker.style.borderRadius = '50%';
    playerMarker.style.backgroundColor = '#00ff00'; 
    playerMarker.style.border = '1px solid #ffffff';
    playerMarker.style.zIndex = '10'; 
    mapContainer.appendChild(playerMarker);

    
    targetMarker = document.createElement('div');
    targetMarker.style.position = 'absolute';
    targetMarker.style.width = '8px';
    targetMarker.style.height = '8px';
    targetMarker.style.borderRadius = '50%';
    targetMarker.style.backgroundColor = '#ff0000'; 
    targetMarker.style.border = '1px solid #ffffff';
    targetMarker.style.zIndex = '10'; 
    targetMarker.style.display = 'none'; 
    mapContainer.appendChild(targetMarker);

    
    mapWorldMinX = -50; 
    mapWorldMaxX = 50;  
    mapWorldMinZ = -50; 
    mapWorldMaxZ = 50;  
    mapWorldWidth = mapWorldMaxX - mapWorldMinX;
    mapWorldDepth = mapWorldMaxZ - mapWorldMinZ;

    
    mapWidthPx = mapContainer.offsetWidth || 200; 
    mapHeightPx = mapContainer.offsetHeight || 150; 

    
    if (obstacles && Array.isArray(obstacles)) {
        obstacles.forEach(obstacle => {
            if (obstacle && obstacle.position) {
                addObstacleMarkerToMap(obstacle.position);
            }
        });
    }

    // console.log("Minimap setup complete."); // Removed log

    // Return the created marker elements so main.js can reference them
    return { playerMarker, targetMarker };
}


function worldToMapCoords(worldX, worldZ) {
    const normX = (worldX - mapWorldMinX) / mapWorldWidth;
    const normZ = (worldZ - mapWorldMinZ) / mapWorldDepth;
    const mapX = BABYLON.Scalar.Clamp(normX, 0, 1) * mapWidthPx;
    const mapY = (1 - BABYLON.Scalar.Clamp(normZ, 0, 1)) * mapHeightPx; 
    return { mapX, mapY };
}


export function updatePlayerMarker(position) {
    if (!playerMarker || !position) return;
    const { mapX, mapY } = worldToMapCoords(position.x, position.z);
    playerMarker.style.left = `${mapX - 4}px`; 
    playerMarker.style.top = `${mapY - 4}px`; 
}


export function updateTargetMarker(position) {
    if (!targetMarker || !position) {
        if (targetMarker) targetMarker.style.display = 'none';
        return;
    }
    const { mapX, mapY } = worldToMapCoords(position.x, position.z);
    targetMarker.style.left = `${mapX - 4}px`; 
    targetMarker.style.top = `${mapY - 4}px`; 
    targetMarker.style.display = 'block'; 
}


export function addObstacleMarkerToMap(position, color = '#808080', size = '4px') {
    if (!mapContainer || !position) return;

    const marker = document.createElement('div');
    marker.style.position = 'absolute';
    marker.style.width = size;
    marker.style.height = size;
    marker.style.backgroundColor = color;
    marker.style.zIndex = '5'; 

    const { mapX, mapY } = worldToMapCoords(position.x, position.z);

    marker.style.left = `${mapX - (parseInt(size) / 2)}px`; 
    marker.style.top = `${mapY - (parseInt(size) / 2)}px`; 

    mapContainer.appendChild(marker);
}

// --- Update Babylon GUI Elements ---

export function updateAltitudeText(altitude) {
    if (altitudeText) {
        altitudeText.text = `Altitude: ${altitude.toFixed(1)} m`;
    }
}

export function updateSpeedText(speed) {
    if (speedText) {
        speedText.text = `Speed: ${speed.toFixed(1)} m/s`;
    }
}

export function updateMissionObjectiveText(text, color = "yellow") {
    if (missionObjectiveText) {
        missionObjectiveText.text = text;
        missionObjectiveText.color = color;
        missionObjectiveText.isVisible = true; // Ensure visible when updated
    }
}

export function updateLivesText(lives) {
    if (livesText) {
        livesText.text = `Lives: ${lives}`;
    }
}

export function updateTimerText(time) {
    if (timerText) {
        timerText.text = `Time: ${Math.max(0, time).toFixed(1)}`;
    }
}

export function showGameOverScreen(show) {
    if (gameOverText) {
        gameOverText.isVisible = show;
    }
     if (missionObjectiveText) {
        missionObjectiveText.isVisible = !show; // Hide objective when game over is shown
    }
     if (missionObjectiveText) {
        missionObjectiveText.isVisible = !show; // Hide objective when game over is shown
    }
     if (timeoutContinueText) {
        timeoutContinueText.isVisible = false; // Ensure continue message is hidden when game over shows
    }
}

// --- Show/Hide Timeout Continue Message ---
export function showTimeoutContinueMessage(show) {
    if (timeoutContinueText) {
        timeoutContinueText.isVisible = show;
    }
    if (missionObjectiveText) {
        missionObjectiveText.isVisible = !show; // Hide objective when continue message is shown
    }
     if (gameOverText) {
        gameOverText.isVisible = false; // Ensure game over message is hidden when continue shows
    }
}


// --- HTML Element Updates (Keep for potential future use or remove if unused) ---

export function updateScore(score) { // Example - Not currently used by Babylon GUI
    const scoreElement = document.getElementById('scoreValue');
    if (scoreElement) {
        scoreElement.textContent = score;
    }
}

// This function updates a separate HTML timer element, not the Babylon GUI one.
// Keep if you have a separate HTML timer, otherwise remove.
export function updateHtmlTimer(time) {
    const timerElement = document.getElementById('timerValue'); // Assumes an HTML element with id="timerValue"
    if (timerElement) {
        timerElement.textContent = Math.max(0, time).toFixed(1);
    }
}

// This function shows a message in a separate HTML element.
export function showHtmlMessage(message, duration = 3000) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, duration);
    }
}
