import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  Camera,
  RefreshCw,
  RotateCw,
  Sparkles
} from 'lucide-react';
import { createFaceLandmarker } from '../services/faceLandmarkerService';
import { ThreeGlassesEngine } from '../services/threeGlassesEngine';
import { calculateFacialMetrics, classifyFaceShape } from '../services/faceGeometry';
import { tryOnSessionRepository } from '../services/productRepository';
import confetti from 'canvas-confetti';

export function VirtualTryOn({
  activeProduct,
  activeColor,
  activeLens,
  onSelectProduct,
  onSelectColor,
  onSelectLens,
  onPhotoCaptured,
  onGoToDittoGrid,
  initialCapturedPhoto = null,
  onOpen360,
  onOpenStyleQuiz
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const landmarkerRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const streamRef = useRef(null);
  const lastLandmarksRef = useRef(null);

  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedSelfie, setCapturedSelfie] = useState(initialCapturedPhoto);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const lastVideoTimeRef = useRef(-1);

  // 1. Initialize Three.js Engine for WebGL overlay if needed
  useEffect(() => {
    if (!containerRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'absolute inset-0 w-full h-full object-cover pointer-events-none z-10';
    containerRef.current.appendChild(canvas);
    canvasRef.current = canvas;

    let engine = null;
    try {
      engine = new ThreeGlassesEngine(canvas);
      engineRef.current = engine;
    } catch (err) {
      console.warn('Three.js WebGL Engine init warning:', err);
    }

    const handleResize = () => {
      if (canvas && engine) {
        engine.resize(canvas.clientWidth || 640, canvas.clientHeight || 480);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (engine) {
        engine.destroy();
        engineRef.current = null;
      }
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
        canvasRef.current = null;
      }
    };
  }, []);

  // 2. Start MediaPipe FaceLandmarker and Camera Stream
  useEffect(() => {
    let isMounted = true;

    async function setupVisionAndCamera() {
      try {
        const landmarker = await createFaceLandmarker();
        if (!isMounted) return;
        landmarkerRef.current = landmarker;
        await startCamera();
      } catch (err) {
        console.error('Face vision setup error:', err);
        setCameraError('Unable to initialize facial recognition. Please check camera permissions.');
      }
    }

    setupVisionAndCamera();

    // Release camera when tab is switched to background so other tabs can use webcam
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopCamera();
      } else if (isMounted) {
        startCamera();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      stopCamera();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch (e) {
          console.warn('Landmarker close warning:', e);
        }
      }
    };
  }, []);

  const startCamera = async () => {
    stopCamera();
    try {
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        const playAndStart = () => {
          videoRef.current.play().catch((e) => console.warn('Video play warning:', e));
          startRenderLoop();
        };

        if (videoRef.current.readyState >= 2) {
          playAndStart();
        } else {
          videoRef.current.onloadedmetadata = playAndStart;
          videoRef.current.onloadeddata = playAndStart;
        }
      }
    } catch (err) {
      console.error('Camera permission failed:', err);
      setCameraError('Camera access denied or unavailable. Please enable camera in your browser.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // 3. Real-time Detection Loop
  const startRenderLoop = () => {
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);

    const loop = () => {
      animFrameIdRef.current = requestAnimationFrame(loop);

      const video = videoRef.current;
      const engine = engineRef.current;
      const landmarker = landmarkerRef.current;
      const canvas = canvasRef.current;

      if (!video || video.readyState < 2) return;

      if (landmarker && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        try {
          const results = landmarker.detectForVideo(video, performance.now());

          if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
            const landmarks = results.faceLandmarks[0];
            lastLandmarksRef.current = landmarks;
            setIsFaceDetected(true);

            if (canvas && engine) {
              const canvasWidth = canvas.clientWidth || 640;
              const canvasHeight = canvas.clientHeight || 480;
              engine.updateHeadPose(landmarks, canvasWidth, canvasHeight);
            }
          } else {
            setIsFaceDetected(false);
          }
        } catch (e) {
          // Frame drop safe
        }
      }
    };

    loop();
  };

  // High-Resolution Snapshot Capture & Optometric Landmarks Calculation
  const handleTakeSnapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;

    setIsCapturing(true);

    try {
      const videoW = video.videoWidth || 1280;
      const videoH = video.videoHeight || 720;
      const squareSize = Math.min(videoW, videoH);

      let faceCenterX = videoW / 2;
      let faceCenterY = videoH / 2;

      if (lastLandmarksRef.current) {
        const lms = lastLandmarksRef.current;
        const nose = lms[168] || lms[6];
        if (nose) {
          faceCenterX = (1 - nose.x) * videoW;
          faceCenterY = nose.y * videoH;
        }
      }

      const cropStartX = Math.max(0, Math.min(videoW - squareSize, faceCenterX - squareSize / 2));
      const cropStartY = Math.max(0, Math.min(videoH - squareSize, faceCenterY - squareSize * 0.44));

      const rawCanvas = document.createElement('canvas');
      rawCanvas.width = squareSize;
      rawCanvas.height = squareSize;
      const rawCtx = rawCanvas.getContext('2d');
      rawCtx.save();
      rawCtx.translate(squareSize, 0);
      rawCtx.scale(-1, 1);

      const videoSourceX = videoW - (cropStartX + squareSize);
      rawCtx.drawImage(
        video,
        videoSourceX,
        cropStartY,
        squareSize,
        squareSize,
        0,
        0,
        squareSize,
        squareSize
      );
      rawCtx.restore();

      const rawPhotoUrl = rawCanvas.toDataURL('image/jpeg', 0.95);
      setCapturedSelfie(rawPhotoUrl);

      // Calculate optometric facial landmarks
      let metrics = null;
      if (lastLandmarksRef.current) {
        const lms = lastLandmarksRef.current;
        const nose = lms[168] || lms[6];
        const rightEye = lms[468] || lms[33];
        const leftEye = lms[473] || lms[362];
        const rightTemple = lms[234];
        const leftTemple = lms[454];

        const toSquareCoord = (lm) => {
          const mirroredX = videoW - lm.x * videoW;
          const mirroredY = lm.y * videoH;
          return {
            x: (mirroredX - cropStartX) / squareSize,
            y: (mirroredY - cropStartY) / squareSize
          };
        };

        const rightEyeSq = toSquareCoord(rightEye);
        const leftEyeSq = toSquareCoord(leftEye);
        const rightTempleSq = toSquareCoord(rightTemple);
        const leftTempleSq = toSquareCoord(leftTemple);

        // In mirrored space, physical right eye is screen-right, physical left eye is screen-left
        const screenLeftEye = leftEyeSq.x < rightEyeSq.x ? leftEyeSq : rightEyeSq;
        const screenRightEye = leftEyeSq.x < rightEyeSq.x ? rightEyeSq : leftEyeSq;

        const dx = screenRightEye.x - screenLeftEye.x;
        const dy = screenRightEye.y - screenLeftEye.y;
        const ipdRatio = Math.max(0.12, Math.min(0.42, Math.hypot(dx, dy)));
        const rawTilt = Math.atan2(dy, dx) * (180 / Math.PI);
        const tiltDeg = Math.max(-10, Math.min(10, rawTilt));
        const faceSpanRatio = Math.abs(leftTempleSq.x - rightTempleSq.x);

        // Center between eyes, resting naturally on nasal bridge
        const pupilCenterX = (screenLeftEye.x + screenRightEye.x) / 2;
        const pupilCenterY = (screenLeftEye.y + screenRightEye.y) / 2;
        const opticalCenterY = pupilCenterY + ipdRatio * 0.10;

        metrics = {
          noseBridge: { x: pupilCenterX, y: opticalCenterY },
          ipdRatio,
          faceSpanRatio,
          tiltDeg
        };

        // Asynchronously save face profile to backend PostgreSQL if accessible
        try {
          const computedFaceMetrics = calculateFacialMetrics(lms, 1280, 720);
          const classification = classifyFaceShape(computedFaceMetrics);
          tryOnSessionRepository.saveFaceProfile({
            session_token: 'vto_sess_' + Date.now(),
            pupillary_distance_mm: Number((computedFaceMetrics?.measuredPdMm || 63.5).toFixed(1)),
            face_width_mm: Math.round(computedFaceMetrics?.measuredFaceWidthMm || 138),
            detected_face_shape: classification.shape || 'Oval',
            transformation_matrix: {
              translation: { x: 0.0, y: 0.05, z: -1.0 },
              rotation: { pitch: 0.0, yaw: 0.0, roll: 0.0 }
            },
            facial_landmarks: (lms || []).slice(0, 40).map(pt => ({
              x: Number(pt.x.toFixed(4)),
              y: Number(pt.y.toFixed(4)),
              z: Number((pt.z || 0).toFixed(4))
            })),
            selfie_image_url: null
          }).catch(() => {});
        } catch (e) {
          // ignore
        }
      }

      if (onPhotoCaptured) {
        onPhotoCaptured(rawPhotoUrl, metrics);
      }

      return rawPhotoUrl;
    } catch (e) {
      console.error('Snapshot capture failed:', e);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [onPhotoCaptured]);

  // Click "Take Photo"
  const handleTakePhotoClick = () => {
    const photo = handleTakeSnapshot();
    setShowSuccessModal(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#000042', '#00bac6', '#dfa64c']
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center py-4 px-2 select-none">
      
      {/* 1. TOP INSTRUCTION TEXT (Exact match with Lenskart Screenshot 1) */}
      <div className="w-full text-center py-2 px-4 mb-4">
        <p className="text-[11px] sm:text-[13px] font-semibold tracking-wider text-slate-500 uppercase leading-relaxed">
          FACE A LIGHT SOURCE, ALIGN YOUR FACE, TAKE OFF YOUR GLASSES, AND TUCK YOUR HAIR BEHIND YOUR EARS
        </p>
      </div>

      {/* 2. CAMERA CONTAINER (Exact match with Lenskart Screenshot 1) */}
      <div className="relative w-full max-w-2xl aspect-[16/10] sm:aspect-[4/3] rounded-[28px] overflow-hidden bg-[#2d3142] shadow-2xl border border-slate-200">
        {/* Underlying Webcam Feed */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          onPlay={startRenderLoop}
          onLoadedData={startRenderLoop}
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
        />

        {/* Three.js Canvas Container */}
        <div
          ref={containerRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Dashed Teal/Emerald Oval Guide (Exact match with Screenshot 1) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-60 h-80 sm:w-68 sm:h-92 md:w-72 md:h-96 rounded-[50%] border-[3px] border-dashed border-[#00dfc4] shadow-[0_0_25px_rgba(0,223,196,0.35)] transition-all" />
        </div>

        {/* Camera Error Message if permissions denied */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-white z-30">
            <Camera className="w-12 h-12 text-rose-400 mb-3" />
            <h4 className="text-base font-bold mb-1">Camera Permission Required</h4>
            <p className="text-xs text-slate-300 max-w-sm mb-4">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-5 py-2.5 rounded-full bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Camera</span>
            </button>
          </div>
        )}

        {/* Shutter Flash Animation */}
        {isCapturing && (
          <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-300 pointer-events-none" />
        )}
      </div>

      {/* 3. BOTTOM BUTTON: "Take Photo" (Exact match with Screenshot 1) */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleTakePhotoClick}
          disabled={isCapturing}
          className="bg-black hover:bg-slate-900 active:scale-95 text-white font-serif font-bold text-sm sm:text-base px-9 py-2.5 rounded-full shadow-lg transition-all"
        >
          Take Photo
        </button>
      </div>

      {/* 4. SUCCESS MODAL DIALOG (Exact match with Lenskart Screenshot 2) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-7 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
            {/* Top Right Close Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 text-slate-400 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* User's Circular Face Photo with clean black border */}
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-900 mx-auto shadow-sm mt-1">
              <img
                src={capturedSelfie}
                alt="Your 3D Avatar"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Heading text */}
            <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 px-2">
              Your 3D has been successfully created!
            </h3>

            {/* Black Pill Button: "View frames in 3D" */}
            <button
              onClick={() => {
                setShowSuccessModal(false);
                if (onGoToDittoGrid) onGoToDittoGrid();
              }}
              className="w-full py-3 bg-black hover:bg-slate-900 active:scale-95 text-white font-serif font-bold text-sm rounded-full shadow-md transition-all"
            >
              View frames in 3D
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
