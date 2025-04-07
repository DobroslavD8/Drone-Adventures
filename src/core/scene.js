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
    // Adjust camera sensitivity for smoother mouse control (Higher value = LESS sensitive)
    camera.angularSensibilityX = 16000; // Increased from 8000
    camera.angularSensibilityY = 16000; // Increased from 8000
    camera.lowerHeightOffsetLimit = 1.0; // Prevent camera from going below y=1 relative to target
    camera.minZ = 0.5; // Prevent camera from getting too close (often prevents ground clipping)
    // camera.attachControl(canvas, true); // Attach control later, only after locking the target

    // Create a light
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // Create ground using a thin Box instead of CreateGround
    const groundSize = 100;
    const groundThickness = 0.5; // Make it thin but not zero
    const ground = BABYLON.MeshBuilder.CreateBox("groundBox", { width: groundSize, height: groundThickness, depth: groundSize }, scene);
    ground.position.y = -groundThickness / 2; // Position it so the top surface is at y=0
    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    // Use original grass texture
    groundMaterial.diffuseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/grass.png", scene);
    groundMaterial.diffuseTexture.uScale = 10; // Original tiling
    groundMaterial.diffuseTexture.vScale = 10;
    groundMaterial.diffuseTexture.level = 1.5; // Increase brightness (default is 1.0)
    // Removed bump/parallax settings
    groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Keep less shiny
    ground.material = groundMaterial;
    ground.receiveShadows = true; // Allow shadows on the ground
    // REMOVED Impostor creation: ground.physicsImpostor = new BABYLON.PhysicsImpostor(...)


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
    // REMOVED Impostor creation: box1.physicsImpostor = new BABYLON.PhysicsImpostor(...)
    obstacles.push(box1);

    // --- Skyscraper 2 ---
    const height2 = 50; // Reduced height
    const box2 = BABYLON.MeshBuilder.CreateBox("building2", { width: 5, depth: 5, height: height2 }, scene);
    box2.position = new BABYLON.Vector3(-10, height2 / 2, -15); // Position base on ground
    box2.material = buildingMaterial;
    box2.receiveShadows = true;
    // REMOVED Impostor creation: box2.physicsImpostor = new BABYLON.PhysicsImpostor(...)
    obstacles.push(box2);

    // --- Skyscraper 3 ---
    const height3 = 30; // Reduced height
    const box3 = BABYLON.MeshBuilder.CreateBox("building3", { width: 8, depth: 8, height: height3 }, scene);
    box3.position = new BABYLON.Vector3(5, height3 / 2, 25); // Position base on ground
    box3.material = buildingMaterial;
    box3.receiveShadows = true;
    // REMOVED Impostor creation: box3.physicsImpostor = new BABYLON.PhysicsImpostor(...)
    obstacles.push(box3);

    // --- New Building 4 ---
    const height4 = 20; // Shorter
    const box4 = BABYLON.MeshBuilder.CreateBox("building4", { width: 7, depth: 5, height: height4 }, scene);
    box4.position = new BABYLON.Vector3(-25, height4 / 2, -5); // New position
    box4.material = buildingMaterial;
    box4.receiveShadows = true;
    // REMOVED Impostor creation: box4.physicsImpostor = new BABYLON.PhysicsImpostor(...)
    obstacles.push(box4);

    // --- Add Trees ---
    const treeMaterialTrunk = new BABYLON.StandardMaterial("treeTrunkMat", scene);
    treeMaterialTrunk.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.1); // Brown
    const treeMaterialLeaves = new BABYLON.StandardMaterial("treeLeavesMat", scene);
    treeMaterialLeaves.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.2); // Dark Green
    const trees = []; // Array to hold tree meshes (trunk + leaves)

    const createTree = (name, position) => {
        const trunk = BABYLON.MeshBuilder.CreateCylinder(`${name}_trunk`, { height: 4, diameter: 0.8 }, scene);
        trunk.material = treeMaterialTrunk;
        trunk.position = position.clone();
        trunk.position.y += 2; // Base at ground level
        // REMOVED Impostor creation: trunk.physicsImpostor = new BABYLON.PhysicsImpostor(...)
        obstacles.push(trunk); // Add trunk to obstacles for collision/map

        const leaves = BABYLON.MeshBuilder.CreateSphere(`${name}_leaves`, { diameter: 3 }, scene);
        leaves.material = treeMaterialLeaves;
        leaves.position = position.clone();
        leaves.position.y += 4.5; // Position above trunk
        // REMOVED Impostor creation: leaves.physicsImpostor = new BABYLON.PhysicsImpostor(...)
        // Don't add leaves to main obstacles array unless needed for specific collision/map logic
        trees.push({ trunk, leaves }); // Store tree parts if needed later
    };

    createTree("tree1", new BABYLON.Vector3(-15, 0, 5));
    createTree("tree2", new BABYLON.Vector3(20, 0, -25));
    createTree("tree3", new BABYLON.Vector3(-5, 0, -30));
    createTree("tree4", new BABYLON.Vector3(30, 0, 30));


    // --- Add Barrels (Hazards) ---
    const barrelMaterial = new BABYLON.StandardMaterial("barrelMat", scene);
    barrelMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.1, 0.1); // Red
    const barrels = []; // Keep track of barrels for collision checks
    const createBarrel = (name, position) => {
        const barrel = BABYLON.MeshBuilder.CreateCylinder(name, { height: 2.5, diameter: 2.0 }, scene); // Enlarged size
        barrel.material = barrelMaterial;
        barrel.position = position.clone();
        barrel.position.y += 1.25; // Adjust Y position based on new height/2
        // REMOVED Impostor creation: barrel.physicsImpostor = new BABYLON.PhysicsImpostor(...)
        barrel.metadata = { type: "barrel" }; // Add metadata for collision identification
        barrels.push(barrel);
        obstacles.push(barrel); // Add barrels to the main obstacles list
    };

    createBarrel("barrel1", new BABYLON.Vector3(10, 0, 15));
    createBarrel("barrel2", new BABYLON.Vector3(-5, 0, 20));
    createBarrel("barrel3", new BABYLON.Vector3(0, 0, -10));
    // --- End Barrels ---


    console.log("Scene, camera, light, ground, obstacles, trees, and barrels created.");

    // Return all created elements, including barrels
    return { scene, camera, light, ground, obstacles, barrels };
}
