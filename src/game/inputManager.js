// Handles Keyboard/Mouse Input

export function initializeInput(scene) {
    if (!scene) {
        console.error("Scene not provided for input initialization!");
        return null;
    }

    // Input state object
    const inputState = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false,
        // rotateLeft: false, // Q - Removed
        // rotateRight: false, // E - Removed
        restart: false, // R - For game over restart
        confirmContinue: false // R - For timeout confirmation
    };

    // Keyboard event listeners
    scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                // Use event.code for layout-independent key identification
                switch (kbInfo.event.code) {
                    case "KeyW": inputState.forward = true; break;
                    case "KeyR": // Use code "KeyR"
                        // Set both flags, the game logic will decide which one to use
                        inputState.restart = true;
                        inputState.confirmContinue = true;
                        // console.log("R key pressed (KEYDOWN)"); // Keep commented or remove
                        break;
                    case "KeyS": inputState.backward = true; break;
                    case "KeyA": inputState.left = true; break; // Strafe left
                    case "KeyD": inputState.right = true; break; // Strafe right
                    // case "KeyQ": inputState.rotateLeft = true; break; // Rotate left - Removed
                    // case "KeyE": inputState.rotateRight = true; break; // Rotate right - Removed
                    case "Space": inputState.up = true; break; // Ascend (Use code "Space")
                    case "ShiftLeft": case "ShiftRight": inputState.down = true; break; // Descend (Already using code)
                }
                break;
            case BABYLON.KeyboardEventTypes.KEYUP:
                // Use event.code for layout-independent key identification
                switch (kbInfo.event.code) {
                    case "KeyW": inputState.forward = false; break;
                    case "KeyR":
                        inputState.restart = false; // Reset both flags on key up
                        inputState.confirmContinue = false;
                        break;
                    case "KeyS": inputState.backward = false; break;
                    case "KeyA": inputState.left = false; break;
                    case "KeyD": inputState.right = false; break;
                    // case "KeyQ": inputState.rotateLeft = false; break; // Removed
                    // case "KeyE": inputState.rotateRight = false; break; // Removed
                    case "Space": inputState.up = false; break; // (Use code "Space")
                    case "ShiftLeft": case "ShiftRight": inputState.down = false; break; // (Already using code)
                }
                break;
        }
    });

    // console.log("Input manager initialized."); // Removed log
    return inputState;
}
