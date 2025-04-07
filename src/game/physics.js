

export function enablePhysics(scene) {
    if (!BABYLON || !CANNON) {
        console.error("Babylon.js or Cannon.js not loaded!");
        return;
    }
    const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
    // Increase the second parameter (iterations/substeps) for better collision detection at high speeds
    const physicsPlugin = new BABYLON.CannonJSPlugin(true, 50, CANNON); // Increased from 10 to 50
    scene.enablePhysics(gravityVector, physicsPlugin);
    // Explicitly set the physics time step (optional, but can sometimes help)
    const physicsEngine = scene.getPhysicsEngine();
    if (physicsEngine) {
        physicsEngine.setTimeStep(1 / 60); // Set to standard 60 FPS step
        // console.log("Physics engine enabled with time step set."); // Removed log
    } else {
        console.error("Failed to get physics engine after enabling physics!");
    }
}
