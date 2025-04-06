\
// Scene Creation, Lighting, Environment

export function createScene(engine) {
    if (!BABYLON) {
        console.error("Babylon.js not loaded!");
        return null;
    }
    if (!engine) {
        console.error("Engine not provided for scene creation!");
        return null;
    }

    const scene = new BABYLON.Scene(engine);
    // scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1); // Dark background - Replaced by Skybox

    // --- Skybox (CubeTexture) ---
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMat", scene);
    skyboxMaterial.backFaceCulling = false; // Render the inside of the box
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://www.babylonjs-playground.com/textures/skybox", scene); // Load cube texture
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE; // Set texture mode
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0); // No diffuse color needed
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // No specular color needed
    skyboxMaterial.disableLighting = true; // Sky doesn't need lighting
    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true; // Keep skybox centered on camera
    // --- End Skybox ---

    // Create a follow camera
    const camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -10), scene);
    camera.radius = 15; // Distance from the target
    camera.heightOffset = 4; // Height above the target
    camera.rotationOffset = 0; // Angle around the target (0 = directly behind)
    camera.cameraAcceleration = 0.05; // How fast the camera moves to follow
    camera.maxCameraSpeed = 10; // Max speed of the camera
    // Adjust camera sensitivity for smoother mouse control
    camera.angularSensibilityX = 4000; // Increased from 2000, higher is less sensitive
    camera.angularSensibilityY = 4000; // Increased from 2000, higher is less sensitive
    camera.lowerHeightOffsetLimit = 1.0; // Prevent camera from going below y=1 relative to target
    camera.minZ = 0.5; // Prevent camera from getting too close (often prevents ground clipping)
    // camera.attachControl(canvas, true); // Attach control later, only after locking the target

    // Create a light
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // Create a ground plane
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    // Revert to original grass texture but make it brighter
    groundMaterial.diffuseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/grass.png", scene); // Original texture
    groundMaterial.diffuseTexture.uScale = 10; // Original tiling
    groundMaterial.diffuseTexture.vScale = 10;
    groundMaterial.diffuseTexture.level = 1.5; // Increase brightness (default is 1.0)
    // Removed bump/parallax settings
    groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Keep less shiny
    ground.material = groundMaterial;
    ground.receiveShadows = true; // Allow shadows on the ground
    // Add physics impostor to the ground (static) - Physics should be enabled before impostors are added
    // We'll assume physics is enabled by the caller before calling this function, or handle it elsewhere
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1, friction: 0.5 }, scene);


    // Add some simple obstacles (Buildings)
    const obstacles = []; // Array to hold obstacle meshes
    const buildingMaterial = new BABYLON.StandardMaterial("buildingMat", scene);
    // Use a skyscraper texture
    buildingMaterial.diffuseTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/skyscraper.jpg", scene);
    buildingMaterial.diffuseTexture.uScale = 2; // Horizontal tiling
    buildingMaterial.diffuseTexture.vScale = 10; // Vertical tiling for height
    buildingMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2); // Some specularity

    // --- Skyscraper 1 ---
    const height1 = 35; // Reduced height
    const box1 = BABYLON.MeshBuilder.CreateBox("building1", { width: 6, depth: 6, height: height1 }, scene);
    box1.position = new BABYLON.Vector3(15, height1 / 2, 10); // Position base on ground
    box1.material = buildingMaterial;
    box1.receiveShadows = true;
    box1.physicsImpostor = new BABYLON.PhysicsImpostor(box1, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1 }, scene);
    obstacles.push(box1);

    // --- Skyscraper 2 ---
    const height2 = 50; // Reduced height
    const box2 = BABYLON.MeshBuilder.CreateBox("building2", { width: 5, depth: 5, height: height2 }, scene);
    box2.position = new BABYLON.Vector3(-10, height2 / 2, -15); // Position base on ground
    box2.material = buildingMaterial;
    box2.receiveShadows = true;
    box2.physicsImpostor = new BABYLON.PhysicsImpostor(box2, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1 }, scene);
    obstacles.push(box2);

    // --- Skyscraper 3 ---
    const height3 = 30; // Reduced height
    const box3 = BABYLON.MeshBuilder.CreateBox("building3", { width: 8, depth: 8, height: height3 }, scene);
    box3.position = new BABYLON.Vector3(5, height3 / 2, 25); // Position base on ground
    box3.material = buildingMaterial;
    box3.receiveShadows = true;
    box3.physicsImpostor = new BABYLON.PhysicsImpostor(box3, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1 }, scene);
    obstacles.push(box3);

    // --- New Building 4 ---
    const height4 = 20; // Shorter
    const box4 = BABYLON.MeshBuilder.CreateBox("building4", { width: 7, depth: 5, height: height4 }, scene);
    box4.position = new BABYLON.Vector3(-25, height4 / 2, -5); // New position
    box4.material = buildingMaterial;
    box4.receiveShadows = true;
    box4.physicsImpostor = new BABYLON.PhysicsImpostor(box4, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.1 }, scene);
    obstacles.push(box4);

    console.log("Scene, camera, light, ground, and obstacles created.");

    return { scene, camera, light, ground, obstacles };
}
