

export function enablePhysics(scene) {
    if (!BABYLON || !CANNON) {
        console.error("Babylon.js or Cannon.js not loaded!");
        return;
    }
    const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
    const cannonPlugin = new BABYLON.CannonJSPlugin(true, 10, CANNON);
    scene.enablePhysics(gravityVector, cannonPlugin);
    console.log("Physics engine enabled.");
}
