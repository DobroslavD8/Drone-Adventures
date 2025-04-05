# Drone Adventures - Browser Game

This is a browser-based single-player drone game developed using HTML5, CSS3, and JavaScript with the Babylon.js framework.

## Objective

Control a drone to complete a series of pickup and delivery missions within the time limit while avoiding obstacles.

## How to Play

1.  Ensure you have a modern web browser (Chrome, Firefox, Edge recommended).
2.  Open the `index.html` file in your browser.
3.  **Controls:**
    *   **Move:** WASD keys
    *   **Ascend:** Spacebar
    *   **Descend:** Shift key
    *   **Rotate (Yaw):** Q / E keys
    *   **Look:** Mouse movement
    *   **Restart (Game Over):** R key
4.  **Gameplay:**
    *   Follow the objective text in the top-left HUD.
    *   Fly to the cyan pickup zone.
    *   Fly to the yellow delivery zone (appears after pickup).
    *   Avoid hitting red barrels and other obstacles.
    *   Complete each mission before the timer runs out.
    *   You have 3 lives. Losing all lives results in Game Over.

## Core Features (Implemented)

*   **Drone Controls:** Keyboard/mouse controls with physics simulation (using Cannon.js).
*   **Missions:** Series of 10 pickup and delivery missions.
*   **Environment:** 3D world with ground, skybox, skyscrapers, trees, and hazardous barrels.
*   **HUD:** Displays Altitude, Speed, Current Objective, Lives Remaining, and Mission Timer.
*   **Mini-Map:** Shows player position (green), target location (red), and static obstacles (grey/green/orange).
*   **Game State:** Lives system, mission timer, invincibility after hits, game over condition, and restart functionality.

## Technical Requirements

*   **Platform:** Web Browsers (HTML5, CSS3, JavaScript).
*   **Framework:** Babylon.js
*   **Performance:** Aiming for 60 FPS.

## Known Issues / Limitations

*   Basic visuals and placeholder textures for some elements.
*   Physics interactions can sometimes be unpredictable.
*   No sound effects or music.
*   Mission difficulty scaling is basic.
