// Scene Creation, Lighting, Environment

// Use async function to allow await for model loading
export async function createScene(engine) {
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
    light.intensity = 0.77; // Increased intensity by ~10%

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

    const obstacles = []; // Array to hold obstacle meshes

    // --- Load Skyscraper Model ---
    // Note: Using relative path from index.html
    const skyscraperResult = await BABYLON.SceneLoader.ImportMeshAsync(
        "", // Load all meshes from the file
        "src/graphic-models/", // Path to the directory
        "skyscraper.glb", // File name
        scene
    );

    // Assuming the first mesh (index 0) is the main skyscraper geometry.
    // GLB models often import with a root node (__root__), so we might need to access its children.
    // Let's assume skyscraperResult.meshes[0] is the root and skyscraperResult.meshes[1] is the visible mesh.
    // If it loads differently, this might need adjustment.
    const originalSkyscraperMesh = skyscraperResult.meshes.find(m => m.id !== "__root__" && m.getTotalVertices() > 0);

    if (!originalSkyscraperMesh) {
        console.error("Skyscraper mesh not found in the loaded GLB file!");
    } else {
        // Disable the original mesh, we'll use instances
        originalSkyscraperMesh.setEnabled(false);
        originalSkyscraperMesh.receiveShadows = true; // Allow instances to receive shadows

        // Define fixed dimensions OUTSIDE the function - FINAL ADJUSTMENT
        const physicsBoxWidth = 2.2;  // Previous best fit
        const physicsBoxHeight = 14;  // Adjusted height (Reduced from 15)
        const physicsBoxDepth = 2.2;  // Previous best fit

        // Function to create CLONES (not instances) and their physics boxes
        // Pass dimensions as arguments
        const createSkyscraperClone = (name, basePosition, width, height, depth, scale = 1) => {
            // Clone the original mesh
            const clone = originalSkyscraperMesh.clone(name, null, true);
            if (!clone) {
                console.error(`Failed to clone skyscraper mesh for ${name}`);
                return null;
            }
            clone.setEnabled(true);

            // Apply scaling FIRST - Make Y scale 3 times larger
            const baseScale = 5;
            const heightMultiplier = 3;
            clone.scaling = new BABYLON.Vector3(baseScale * scale, baseScale * scale * heightMultiplier, baseScale * scale);
            clone.receiveShadows = true;

            // --- Create Fixed-Size Invisible Physics Box ---
            console.log(`[${name}] Using fixed physics box size: W=${width}, H=${height}, D=${depth}`);

            const physicsBox = BABYLON.MeshBuilder.CreateBox(`${name}_physicsBox`, {
                width: width,   // Use argument
                height: height, // Use argument
                depth: depth    // Use argument
            }, scene);

            // Position the PHYSICS BOX center based on the basePosition and passed height
            physicsBox.position = basePosition.clone(); // Start at base X,Z
            physicsBox.position.y += height / 2;   // Move center up by half of passed height
            physicsBox.isVisible = false; // Make it invisible
            console.log(`[${name}] Physics box final position (center): X=${physicsBox.position.x.toFixed(2)}, Y=${physicsBox.position.y.toFixed(2)}, Z=${physicsBox.position.z.toFixed(2)}`);

            // Parent the visual clone to the physics box
            clone.parent = physicsBox;

            // Set the visual clone's LOCAL position relative to the physics box
            // Assuming both pivots are centered, move visual down by half-height
            clone.position = new BABYLON.Vector3(0, -height / 2, 0); // Use height argument here
            console.log(`[${name}] Visual clone LOCAL position set relative to parent physics box.`);

            obstacles.push(physicsBox); // Add physics box to obstacles for impostor creation
            // --- End Invisible Physics Box ---

            return clone; // Return the visual clone (now parented)
        };

        // Create CLONES (visual) and their corresponding physics boxes (added to obstacles)
        // Pass the dimensions to the function
        createSkyscraperClone("skyscraper1", new BABYLON.Vector3(15, 0, 10), physicsBoxWidth, physicsBoxHeight, physicsBoxDepth);
        createSkyscraperClone("skyscraper2", new BABYLON.Vector3(-10, 0, -15), physicsBoxWidth, physicsBoxHeight, physicsBoxDepth);
        createSkyscraperClone("skyscraper3", new BABYLON.Vector3(5, 0, 25), physicsBoxWidth, physicsBoxHeight, physicsBoxDepth);
        createSkyscraperClone("skyscraper4", new BABYLON.Vector3(-25, 0, -5), physicsBoxWidth, physicsBoxHeight, physicsBoxDepth);
        createSkyscraperClone("skyscraper5", new BABYLON.Vector3(25, 0, -10), physicsBoxWidth, physicsBoxHeight, physicsBoxDepth);
        createSkyscraperClone("skyscraper6", new BABYLON.Vector3(-20, 0, 20), physicsBoxWidth, physicsBoxHeight, physicsBoxDepth);
    }
    // --- End Skyscraper Model ---


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
