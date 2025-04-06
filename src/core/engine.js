// Babylon.js Engine Setup

export function initializeEngine(canvas) {
    if (!BABYLON) {
        console.error("Babylon.js not loaded!");
        return null;
    }
    if (!canvas) {
        console.error("Canvas element not found!");
        return null;
    }
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    return engine;
}
