\

let mapContainer, playerMarker, targetMarker;
let mapWorldMinX, mapWorldMaxX, mapWorldMinZ, mapWorldMaxZ;
let mapWorldWidth, mapWorldDepth;
let mapWidthPx, mapHeightPx;


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

    console.log("Minimap setup complete.");
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


export function updateScore(score) {
    const scoreElement = document.getElementById('scoreValue');
    if (scoreElement) {
        scoreElement.textContent = score;
    }
}


export function updateTimer(time) {
    const timerElement = document.getElementById('timerValue');
    if (timerElement) {
        timerElement.textContent = Math.max(0, time).toFixed(1);
    }
}


export function showMessage(message, duration = 3000) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, duration);
    }
}
