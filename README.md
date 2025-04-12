# Drone Adventures - Browser Game

A browser-based 3D drone simulation game built with modern web technologies. Navigate through a dynamic environment, complete missions, and test your piloting skills!

## Project Structure

```
├── index.html          # Main HTML file
├── style.css          # Global styles
└── src/               # Source code directory
    ├── main.js        # Main entry point: imports modules, orchestrates initialization & game loop
    ├── core/          # Core engine and scene setup
    │   ├── engine.js  # Babylon.js engine initialization
    │   └── scene.js   # Creates scene, camera, lights, ground, skybox, loads/places obstacles (skyscraper model, trees, barrels)
    ├── game/          # Game logic and mechanics
    │   ├── drone.js   # Drone mesh creation, physics update logic, visual tilt, state reset
    │   ├── inputManager.js # Keyboard input state management
    │   ├── missionManager.js # Mission data (pickup/delivery locations, adjusted heights), setup, progression logic, minimap target updates
    │   └── physics.js # Enables physics engine (Cannon.js) and sets parameters
    ├── ui/            # User interface elements
    │   └── uiManager.js # Babylon.js GUI (HUD, game over, controls) & HTML minimap setup/updates
    ├── graphic-models/ # 3D models (drone.glb, skyscraper.glb)
    └── images/         # UI images (background.png, favicon.png)
```

## Features

* **3D Environment:** Immersive world built with Babylon.js
* **Physics Engine:** Realistic drone movement and collision detection (with world boundaries)
* **Realistic Rotation:** Drone automatically turns to face its direction of movement and includes a self-righting mechanism to prevent staying flipped over.
* **Dynamic Lighting:** Day/night cycle with real-time shadows (slightly increased brightness).
* **Responsive Controls:** Intuitive keyboard and mouse controls
* **Mission System:** Progressive challenges and objectives with a 30-second time limit per mission.
* **Scoring System:** Earn points for completing missions quickly.
* **Persistent Leaderboard:** Top 10 scores are saved globally using Firebase Realtime Database, with medals (🥇🥈🥉) for the top 3.
* **Nickname Prompt:** Enter a nickname before starting the game (features background image and animated drones).
* **Timeout Recovery:** If the timer runs out but you still have lives, press 'R' to reset the drone and timer to retry the current objective.
* **Performance Optimized:** Smooth gameplay experience
* **Favicon:** Custom favicon added.

## Getting Started

1. Clone the repository
2. **Firebase Setup (Required for Leaderboard):**
   * Create a free Firebase project.
   * Enable the Realtime Database (start in "test mode" for development).
   * Register a Web App in your Firebase project settings.
   * Copy the `firebaseConfig` object provided by Firebase.
   * Paste your `firebaseConfig` into `src/main.js`, replacing the placeholder configuration.
3. Open `index.html` in a modern web browser (Chrome, Firefox, or Edge recommended).
4. Enter a nickname when prompted (or accept "Guest").
5. Start playing!

## Controls

* **Movement:** 
  * W/A/S/D keys to tilt the drone for directional movement
  * Spacebar to increase thrust (up)
  * Shift to decrease thrust (down)
* **Camera:**
  * Mouse movement to control camera angle
  * Click to lock/unlock mouse pointer
* **Objective:** Collect targets within the time limit while avoiding obstacles.
* **Mini-map:** Shows your position and target locations.
* **Restart/Continue:**
  * Press 'R' when the game is over (no lives left) to restart the game from the beginning.
  * Press 'R' when prompted after a mission timeout (with lives remaining) to continue the current mission attempt.

## Development

### Prerequisites
* Modern web browser with WebGL support
* Basic understanding of HTML5, CSS3, and JavaScript
* Familiarity with Babylon.js (optional)

### Running Locally
Simply open `index.html` in your browser. No build process or server required!

## Technical Stack

* **Frontend:** HTML5, CSS3, JavaScript (ES6 Modules)
* **3D Engine:** Babylon.js for rendering and scene management
* **Physics:** Cannon.js physics engine integration
* **Architecture:** Modular design with separate components for:
  * Core engine setup and scene management
  * Game mechanics and physics
  * User interface and HUD
  * Input handling and controls
* **Assets:** Uses GLB models (`drone.glb`, `skyscraper.glb`), textures, and skybox

## Future Enhancements

* Add multiplayer support
* Implement more challenging missions
* Add sound effects and background music
* Enhance visual effects and particle systems
* Add customizable drone skins
* Improve security rules for Firebase database

## Contributing

Feel free to fork the project and submit pull requests. For major changes, please open an issue first to discuss the proposed changes.

## License

This project is open source and available under the MIT License.
