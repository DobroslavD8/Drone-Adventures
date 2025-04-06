# Drone Adventures - Browser Game

A browser-based 3D drone simulation game built with modern web technologies. Navigate through a dynamic environment, complete missions, and test your piloting skills!

## Project Structure

```
├── index.html          # Main HTML file
├── style.css          # Global styles
└── src/               # Source code directory
    ├── main.js        # Main entry point, initializes modules
    ├── core/          # Core engine functionality
    │   ├── engine.js  # Babylon.js engine setup
    │   ├── scene.js   # Scene creation, lighting, environment
    │   └── assetLoader.js # Asset loading utilities
    ├── game/          # Game mechanics
    │   ├── drone.js   # Drone physics and controls
    │   ├── inputManager.js # Keyboard/mouse input handling
    │   ├── missionManager.js # Mission and scoring system
    │   └── physics.js # Physics setup and helpers
    ├── ui/            # User interface
    │   └── uiManager.js # UI updates (minimap, score, timer)
    └── graphic-models/ # 3D models and assets
```

## Features

* **3D Environment:** Immersive world built with Babylon.js
* **Physics Engine:** Realistic drone movement and collision detection
* **Dynamic Lighting:** Day/night cycle with real-time shadows
* **Responsive Controls:** Intuitive keyboard and mouse controls
* **Mission System:** Progressive challenges and objectives
* **Performance Optimized:** Smooth gameplay experience

## Getting Started

1. Clone the repository
2. Open `index.html` in a modern web browser (Chrome, Firefox, or Edge recommended)
3. Start playing!

## Controls

* **Movement:** 
  * W/A/S/D keys to tilt the drone for directional movement
  * Spacebar to increase thrust (up)
  * Shift to decrease thrust (down)
* **Camera:** 
  * Mouse movement to control camera angle
  * Click to lock/unlock mouse pointer
* **Objective:** Collect targets while avoiding obstacles
* **Mini-map:** Shows your position and target locations

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
* **Assets:** 3D models, textures, and skybox

## Future Enhancements

* Add multiplayer support
* Implement more challenging missions
* Add sound effects and background music
* Enhance visual effects and particle systems
* Add customizable drone skins
* Implement a scoring system

## Contributing

Feel free to fork the project and submit pull requests. For major changes, please open an issue first to discuss the proposed changes.

## License

This project is open source and available under the MIT License.