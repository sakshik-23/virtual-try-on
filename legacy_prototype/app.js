import * as THREE from "./vendor/three.module.min.js";
import { FaceLandmarker, FilesetResolver } from "./vendor/mediapipe/vision_bundle.mjs";

// Grab UI elements
const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('3d-overlay');
const statusElement = document.getElementById('status');

let scene, camera, renderer, glassesModel;
let faceLandmarker;
let lastVideoTime = -1;

// Math vectors declared globally to protect browser memory performance
const noseBridgePos = new THREE.Vector3();
const leftTemplePos = new THREE.Vector3();
const rightTemplePos = new THREE.Vector3();

// 1. Initialize the Three.js Graphics Environment
function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 640 / 480, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({
        canvas: canvasElement,
        alpha: true,
        antialias: true
    });
    renderer.setSize(640, 480);

    // Create baseline studio lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Add a highly visible placeholder cylinder acting as testing glasses
    const geometry = new THREE.CylinderGeometry(0.1, 0.1, 1.8, 32);
    geometry.rotateZ(Math.PI / 2); // Make the cylinder lay horizontally
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Neon Green
    glassesModel = new THREE.Mesh(geometry, material);
    glassesModel.visible = false;
    scene.add(glassesModel);
}

// 2. Initialize MediaPipe Face Tracking Engine
async function initAI() {
    try {
        const wasmPath = new URL("./vendor/mediapipe/wasm", import.meta.url).href;
        const modelPath = new URL("./models/face_landmarker.task", import.meta.url).href;

        const vision = await FilesetResolver.forVisionTasks(wasmPath);

        const landmarkerOptions = {
            outputFaceBlendshapes: false,
            runningMode: "VIDEO",
            numFaces: 1
        };

        try {
            faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                ...landmarkerOptions,
                baseOptions: {
                    modelAssetPath: modelPath,
                    delegate: "GPU"
                }
            });
        } catch (gpuError) {
            console.warn("GPU delegate failed, falling back to CPU.", gpuError);
            faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                ...landmarkerOptions,
                baseOptions: {
                    modelAssetPath: modelPath,
                    delegate: "CPU"
                }
            });
        }

        statusElement.innerText = "Camera Accessing...";
        startCamera();
    } catch (error) {
        statusElement.innerText = "Initialization Failed! Serve via HTTP and keep vendor/ + models/ files local.";
        console.error("AI Startup Failure: ", error);
    }
}

// 3. Connect User Webcam Stream
function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then((stream) => {
            videoElement.srcObject = stream;
            videoElement.addEventListener("loadeddata", () => {
                statusElement.innerText = "Tracking Ready! Show your face.";
                // Begin frame execution loop immediately
                requestAnimationFrame(predictLoop);
            });
        })
        .catch((err) => {
            statusElement.innerText = "Camera Denied!";
            console.error(err);
        });
}

// 4. Infinite Processing Loop Execution (Per Frame)
function predictLoop() {
    // Only parse data frames if the webcam video stream has successfully moved time intervals
    if (videoElement.currentTime !== lastVideoTime) {
        lastVideoTime = videoElement.currentTime;

        // Execute tracking logic
        const startTimeMs = performance.now();
        const results = faceLandmarker.detectForVideo(videoElement, startTimeMs);

        // Process landmarks if a face exists
        if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
            const landmarks = results.faceLandmarks;

            // Core anchor mapping indices: face 0, then landmark id
            const noseBridge = landmarks[0][1];
            const leftTemple = landmarks[0][234];
            const rightTemple = landmarks[0][454];

            // Vector matrix tracking coordinate alignment
            noseBridgePos.set((noseBridge.x - 0.5) * -4, (noseBridge.y - 0.5) * -3, (noseBridge.z * -2));
            leftTemplePos.set((leftTemple.x - 0.5) * -4, (leftTemple.y - 0.5) * -3, (leftTemple.z * -2));
            rightTemplePos.set((rightTemple.x - 0.5) * -4, (rightTemple.y - 0.5) * -3, (rightTemple.z * -2));

            // Position target frame
            glassesModel.position.copy(noseBridgePos);

            // Scale calculations
            const faceWidth = leftTemplePos.distanceTo(rightTemplePos);
            glassesModel.scale.set(faceWidth * 0.7, faceWidth * 0.7, faceWidth * 0.7);

            // Angle alignment calculation (Roll)
            const eyeVector = new THREE.Vector3().subVectors(rightTemplePos, leftTemplePos).normalize();
            const rollAngle = Math.atan2(eyeVector.y, eyeVector.x);
            glassesModel.rotation.z = rollAngle;

            glassesModel.visible = true;
        } else {
            // Hide object if person steps out of bounds
            glassesModel.visible = false;
        }
    }

    // Command Three.js to redraw changes inside canvas layout view
    renderer.render(scene, camera);

    // Call next cycle step
    requestAnimationFrame(predictLoop);
}

// Run sequence script steps
init3D();
initAI();
