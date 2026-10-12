import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * MediaPipe FaceLandmarker Service
 * Robust offline-first loading with CDN fallback, GPU/CPU auto-negotiation.
 */
export async function createFaceLandmarker(onProgress) {
  if (onProgress) onProgress('Loading vision models...');

  let vision = null;
  const wasmPaths = [
    '/wasm', // Local public folder
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm' // CDN Fallback
  ];

  for (const path of wasmPaths) {
    try {
      vision = await FilesetResolver.forVisionTasks(path);
      if (vision) break;
    } catch (e) {
      console.warn(`WASM failed from ${path}, trying fallback...`, e);
    }
  }

  if (!vision) {
    throw new Error('Unable to load MediaPipe Vision WASM binary.');
  }

  if (onProgress) onProgress('Initializing Face Mesh neural network...');

  const modelPaths = [
    '/models/face_landmarker.task', // Local public folder
    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task' // CDN Fallback
  ];

  const baseConfig = {
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
    runningMode: 'VIDEO',
    numFaces: 1
  };

  // Try GPU first, fallback to CPU
  for (const modelPath of modelPaths) {
    try {
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        ...baseConfig,
        baseOptions: {
          modelAssetPath: modelPath,
          delegate: 'GPU'
        }
      });
      return landmarker;
    } catch (gpuErr) {
      console.warn(`GPU delegate failed for ${modelPath}, trying CPU...`, gpuErr);
      try {
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          ...baseConfig,
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: 'CPU'
          }
        });
        return landmarker;
      } catch (cpuErr) {
        console.warn(`CPU delegate failed for ${modelPath}, trying next source...`, cpuErr);
      }
    }
  }

  throw new Error('Failed to initialize FaceLandmarker neural model.');
}
