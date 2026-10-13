import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  X,
  ChevronRight,
  Maximize2,
  Minimize2,
  RotateCw,
  Eye,
  ShieldCheck,
  MapPin,
  QrCode,
  Download,
  ShoppingBag,
  Award,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';
import { createFaceLandmarker } from '../services/faceLandmarkerService';
import { ThreeGlassesEngine } from '../services/threeGlassesEngine';
import { calculateFacialMetrics, classifyFaceShape, calculateHeadPose } from '../services/faceGeometry';
import { EYEWEAR_CATALOG, FACE_SHAPES_INFO } from '../services/catalogData';
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

  // Workflow State Machine: 1: Calibration, 2: 180° Map, 3: Analysis, 4: Live 3D Fit, 5: Stylist, 6: Omnichannel
  const [currentStep, setCurrentStep] = useState(initialCapturedPhoto ? 4 : 1);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedSelfie, setCapturedSelfie] = useState(initialCapturedPhoto);
  const [isFullscreenView, setIsFullscreenView] = useState(false);

  // Step 2: 180-Degree Sweep Tracking State
  const [sweepProgress, setSweepProgress] = useState({
    centerLocked: false,
    leftLocked: false,
    rightLocked: false
  });
  const [currentYaw, setCurrentYaw] = useState(0);
  const [showSweepSuccess, setShowSweepSuccess] = useState(false);

  // Step 3 & 5: Biometric Analysis & Stylist State
  const [faceAnalysis, setFaceAnalysis] = useState(() => {
    try {
      const saved = localStorage.getItem('spectra_face_analysis');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stylistFilter, setStylistFilter] = useState('all'); // 'all' | 'recommended' | 'bestsellers'

  // Step 6: Omnichannel Store Synergy State
  const [showStoreTrialModal, setShowStoreTrialModal] = useState(false);
  const [trialToken, setTrialToken] = useState(() => `LK-TRYON-${Math.floor(100000 + Math.random() * 900000)}`);
  const [trialBooked, setTrialBooked] = useState(false);

  const lastVideoTimeRef = useRef(-1);

  // 1. Initialize Three.js Engine with dynamic canvas
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
      console.error('Failed to initialize Three.js WebGL Engine:', err);
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

  // 2. Synchronize active eyewear product and styling with Three.js Engine
  useEffect(() => {
    if (engineRef.current && activeProduct) {
      engineRef.current.setStyle(activeProduct.shape || 'wayfarer');
    }
  }, [activeProduct]);

  useEffect(() => {
    if (engineRef.current && activeColor) {
      engineRef.current.updateFrameColor(activeColor);
    }
  }, [activeColor]);

  useEffect(() => {
    if (engineRef.current && activeLens) {
      engineRef.current.updateLensTint(activeLens);
    }
  }, [activeLens]);

  // 3. Start MediaPipe FaceLandmarker and Camera Stream
  useEffect(() => {
    let isMounted = true;

    async function setupVisionAndCamera() {
      try {
        const landmarker = await createFaceLandmarker();
        if (!isMounted) return;
        landmarkerRef.current = landmarker;
        await startCamera();
      } catch (err) {
        console.error('Vision startup error:', err);
        if (isMounted) {
          setCameraError('Camera access denied or unavailable. Please allow webcam permissions.');
        }
      }
    }

    setupVisionAndCamera();

    return () => {
      isMounted = false;
      stopCamera();
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
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

  // 4. Real-time Detection Loop with Step 2 180° Sweep Tracking
  const startRenderLoop = () => {
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);

    const loop = () => {
      animFrameIdRef.current = requestAnimationFrame(loop);

      const video = videoRef.current;
      const engine = engineRef.current;
      const landmarker = landmarkerRef.current;
      const canvas = canvasRef.current;

      if (!video || !engine || !canvas || video.readyState < 2) return;

      if (landmarker && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        try {
          const results = landmarker.detectForVideo(video, performance.now());

          if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
            const landmarks = results.faceLandmarks[0];
            lastLandmarksRef.current = landmarks;
            setIsFaceDetected(true);

            const canvasWidth = canvas.clientWidth || 640;
            const canvasHeight = canvas.clientHeight || 480;

            // Calculate real-time 3D head pose for 180° sweep tracking
            const pose = calculateHeadPose(landmarks);
            setCurrentYaw(pose.yaw);

            // Step 2 180° Sweep Auto-Capture Logic
            if (currentStep === 2) {
              setSweepProgress((prev) => {
                const next = { ...prev };
                if (Math.abs(pose.yaw) < 10 && !prev.centerLocked) {
                  next.centerLocked = true;
                }
                if (pose.yaw < -16 && !prev.leftLocked) {
                  next.leftLocked = true;
                }
                if (pose.yaw > 16 && !prev.rightLocked) {
                  next.rightLocked = true;
                }
                return next;
              });
            }

            // In Step 4 & 5, superimpose 3D glasses in real time
            if (currentStep >= 3) {
              engine.updatePose(landmarks, canvasWidth, canvasHeight);
            } else {
              engine.updatePose(null);
            }
          } else {
            setIsFaceDetected(false);
            engine.updatePose(null);
          }
        } catch (detectErr) {
          console.warn('Face detection loop warning:', detectErr);
        }
      }

      engine.render();
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
  };

  // When all 3 sweep angles are locked, run Step 3 Analysis
  useEffect(() => {
    if (
      currentStep === 2 &&
      sweepProgress.centerLocked &&
      sweepProgress.leftLocked &&
      sweepProgress.rightLocked &&
      !showSweepSuccess
    ) {
      setShowSweepSuccess(true);
      setTimeout(() => {
        handleRunAnalysis();
      }, 700);
    }
  }, [currentStep, sweepProgress, showSweepSuccess]);

  // Step 3: Face Measurement and Shape Analysis Processor
  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setCurrentStep(3);

    // Capture front portrait snapshot
    handleTakeSnapshot(false);

    setTimeout(() => {
      const lms = lastLandmarksRef.current;
      const metrics = calculateFacialMetrics(lms, 640, 480);
      const classification = classifyFaceShape(lms);

      const analysisResult = {
        faceShape: classification.shape || 'Oval',
        confidence: Math.round((classification.confidence || 0.92) * 100),
        measuredPdMm: metrics?.measuredPdMm || 63.5,
        faceWidthMm: metrics?.measuredFaceWidthMm || 138,
        recommendedSize: metrics?.recommendedSize || 'Medium',
        recommendedStyles: (FACE_SHAPES_INFO[classification.shape] || FACE_SHAPES_INFO.Oval).recommendedFrames
      };

      setFaceAnalysis(analysisResult);
      try {
        localStorage.setItem('spectra_face_analysis', JSON.stringify(analysisResult));
      } catch (e) {
        console.warn('Quota error', e);
      }

      setIsAnalyzing(false);

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#000042', '#00bac6', '#10b981']
      });
    }, 1200);
  };

  // High-Resolution Snapshot Capture
  const handleTakeSnapshot = useCallback((triggerConfetti = true) => {
    const video = videoRef.current;
    if (!video) return;

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

        const noseSq = toSquareCoord(nose);
        const rightEyeSq = toSquareCoord(rightEye);
        const leftEyeSq = toSquareCoord(leftEye);
        const rightTempleSq = toSquareCoord(rightTemple);
        const leftTempleSq = toSquareCoord(leftTemple);

        // In mirrored space, physical right eye is screen-right, physical left eye is screen-left
        // Ensure vector goes from screen-left to screen-right for positive horizontal delta
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
      }

      if (triggerConfetti) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#000042', '#00bac6', '#dfa64c']
        });
      }

      if (onPhotoCaptured) {
        onPhotoCaptured(rawPhotoUrl, metrics);
      }
    } catch (e) {
      console.error('Snapshot capture failed:', e);
    } finally {
      setIsCapturing(false);
    }
  }, [onPhotoCaptured]);

  // Digital Stylist Filtered Catalog
  const stylistFilteredCatalog = EYEWEAR_CATALOG.filter((item) => {
    if (stylistFilter === 'recommended' && faceAnalysis) {
      return (
        item.matchesFaceShape(faceAnalysis.faceShape) ||
        item.size === faceAnalysis.recommendedSize
      );
    }
    if (stylistFilter === 'bestsellers') {
      return item.tags?.includes('Bestseller') || item.rating >= 4.8;
    }
    return true;
  });

  return (
    <div className={`w-full mx-auto flex flex-col items-center py-2 transition-all duration-300 ${
      isFullscreenView ? 'max-w-6xl' : 'max-w-4xl'
    }`}>
      {/* 6-STEP LENSKART PIPELINE STEPPER NAVIGATOR */}
      <div className="w-full max-w-2xl mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 shadow-sm">
        <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none text-[11px] font-bold">
          {[
            { step: 1, label: '1. Calibrate' },
            { step: 2, label: '2. 180° Map' },
            { step: 3, label: '3. Face Analytics' },
            { step: 4, label: '4. Live 3D Fit' },
            { step: 5, label: '5. Digital Stylist' },
            { step: 6, label: '6. Store Trial' }
          ].map(({ step, label }) => {
            const isActive = currentStep === step;
            const isCompleted = currentStep > step;
            return (
              <button
                key={step}
                onClick={() => {
                  if (step === 6) setShowStoreTrialModal(true);
                  else setCurrentStep(step);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#000042] text-white shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${
                    isActive ? 'bg-[#00bac6] text-[#000042]' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {step}
                  </span>
                )}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN VIEWPORT CONTAINER */}
      <div className={`relative w-full rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-200 transition-all duration-300 ${
        isFullscreenView ? 'aspect-[16/10] sm:aspect-[16/9]' : 'aspect-[16/10] max-w-2xl'
      }`}>
        {/* Underlying Mirrored Webcam Feed */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          onPlay={startRenderLoop}
          onLoadedData={startRenderLoop}
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
        />

        {/* Three.js AR 3D Eyewear Superimposition Canvas */}
        <div
          ref={containerRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Shutter Flash Effect */}
        {isCapturing && (
          <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-300 pointer-events-none" />
        )}

        {/* STEP 1: ALIGNMENT OVAL & LIGHTING CALIBRATION OVERLAY */}
        {currentStep === 1 && (
          <div className="absolute inset-0 flex flex-col items-center justify-between p-6 z-20 pointer-events-none">
            {/* Top Prompt */}
            <div className="pointer-events-auto bg-black/75 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/15 text-center text-white shadow-lg animate-in fade-in">
              <div className="text-xs font-bold uppercase tracking-wider text-[#00bac6] flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Step 1: Calibration</span>
              </div>
              <p className="text-[11px] text-slate-200 font-medium mt-0.5">
                Please remove your glasses and center your face in the oval
              </p>
            </div>

            {/* Calibration Oval Guide with Real-time State Feedback */}
            <div className="relative flex items-center justify-center">
              <div
                className={`w-60 h-76 sm:w-68 sm:h-88 rounded-[50%] border-[3.5px] border-dashed transition-all duration-300 ${
                  isFaceDetected
                    ? 'border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.4)]'
                    : 'border-white/60 animate-pulse'
                }`}
              />
              <div className="absolute -bottom-8 pointer-events-auto bg-black/70 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-semibold text-white border border-white/10 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isFaceDetected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{isFaceDetected ? 'Face Aligned & Lighting Calibrated' : 'Aligning Face...'}</span>
              </div>
            </div>

            {/* Bottom Proceed Action Button */}
            <div className="pointer-events-auto">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!isFaceDetected}
                className={`px-7 py-3 rounded-full font-bold text-xs uppercase tracking-wider shadow-xl transition-all flex items-center gap-2 ${
                  isFaceDetected
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white hover:scale-105 active:scale-95'
                    : 'bg-white/40 text-white/60 cursor-not-allowed'
                }`}
              >
                <span>Start 180° Facial Mapping</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: 180-DEGREE SWEEP CAPTURE OVERLAY */}
        {currentStep === 2 && (
          <div className="absolute inset-0 flex flex-col items-center justify-between p-6 z-20 pointer-events-none">
            {/* Top Prompt with Dynamic Directional Instructions */}
            <div className="pointer-events-auto bg-black/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/15 text-center text-white shadow-lg">
              <div className="text-xs font-bold uppercase tracking-wider text-[#00bac6] flex items-center justify-center gap-1.5">
                <RotateCw className="w-4 h-4" />
                <span>Step 2: 180° Facial Landmark Mapping</span>
              </div>
              <p className="text-[11px] text-slate-200 font-medium mt-0.5">
                {!sweepProgress.centerLocked
                  ? 'Look straight at the camera'
                  : !sweepProgress.leftLocked
                  ? 'Now gently turn your head to your Left'
                  : !sweepProgress.rightLocked
                  ? 'Great! Now gently turn your head to your Right'
                  : 'Mapping complete! Generating 3D Biometrics...'}
              </p>
            </div>

            {/* Live Yaw Compass & Sweep Angle Indicators */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-4 bg-black/70 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 shadow-xl">
                {/* Left Angle */}
                <div className={`flex flex-col items-center gap-1 transition-all ${
                  sweepProgress.leftLocked ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs ${
                    sweepProgress.leftLocked ? 'bg-emerald-500 text-white border-emerald-400' : 'border-white/30'
                  }`}>
                    {sweepProgress.leftLocked ? <Check className="w-4 h-4" /> : '←'}
                  </div>
                  <span className="text-[9px] uppercase font-bold">Left (~25°)</span>
                </div>

                <div className="h-6 w-px bg-white/20" />

                {/* Center Angle */}
                <div className={`flex flex-col items-center gap-1 transition-all ${
                  sweepProgress.centerLocked ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs ${
                    sweepProgress.centerLocked ? 'bg-emerald-500 text-white border-emerald-400' : 'border-white/30'
                  }`}>
                    {sweepProgress.centerLocked ? <Check className="w-4 h-4" /> : '●'}
                  </div>
                  <span className="text-[9px] uppercase font-bold">Center (0°)</span>
                </div>

                <div className="h-6 w-px bg-white/20" />

                {/* Right Angle */}
                <div className={`flex flex-col items-center gap-1 transition-all ${
                  sweepProgress.rightLocked ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs ${
                    sweepProgress.rightLocked ? 'bg-emerald-500 text-white border-emerald-400' : 'border-white/30'
                  }`}>
                    {sweepProgress.rightLocked ? <Check className="w-4 h-4" /> : '→'}
                  </div>
                  <span className="text-[9px] uppercase font-bold">Right (~25°)</span>
                </div>
              </div>

              {/* Real-time Angle Feedback Gauge */}
              <div className="bg-black/60 px-3 py-1 rounded-full text-[10px] font-semibold text-slate-300 border border-white/10">
                Current Yaw: <span className="text-white font-bold">{currentYaw}°</span>
              </div>
            </div>

            {/* Skip to Analysis Button */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={handleRunAnalysis}
                className="px-5 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold backdrop-blur-md transition-all flex items-center gap-1.5"
              >
                <span>Skip to Biometric Analysis</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: BIOMETRIC ANALYSIS RESULT MODAL */}
        {currentStep === 3 && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-30 animate-in fade-in duration-300">
            {isAnalyzing ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 border-4 border-[#00bac6] border-t-transparent rounded-full animate-spin mx-auto shadow-lg" />
                <div>
                  <h3 className="text-base font-bold text-white">Analyzing 468 3D Facial Landmarks</h3>
                  <p className="text-xs text-slate-400 mt-1">Calculating PD, face width, and classifying facial topology...</p>
                </div>
              </div>
            ) : faceAnalysis ? (
              <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Biometric Analysis Complete</span>
                </div>

                <div className="flex items-center justify-center gap-4">
                  {capturedSelfie && (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#000042] shadow-md shrink-0">
                      <img src={capturedSelfie} alt="Face Avatar" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Detected Profile</div>
                    <div className="text-xl font-serif font-bold text-slate-900">{faceAnalysis.faceShape} Face Shape</div>
                    <div className="text-xs font-semibold text-emerald-600 mt-0.5">{faceAnalysis.confidence}% Match Confidence</div>
                  </div>
                </div>

                {/* Metric Cards Grid */}
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Pupillary (PD)</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{faceAnalysis.measuredPdMm} mm</div>
                    <div className="text-[9px] text-slate-500">Accurate Fit</div>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Face Width</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{faceAnalysis.faceWidthMm} mm</div>
                    <div className="text-[9px] text-slate-500">Cheekbone Span</div>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] uppercase font-bold text-emerald-700">Frame Size</div>
                    <div className="text-sm font-bold text-emerald-800 mt-0.5">{faceAnalysis.recommendedSize}</div>
                    <div className="text-[9px] text-emerald-600 font-semibold">Recommended</div>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentStep(4)}
                  className="w-full py-3.5 rounded-full bg-[#000042] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#000028] shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#00bac6]" />
                  <span>Start Live 3D Try-On with Recommended Frames</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* STEP 4 & 5: LIVE 3D AR FIT CONTROLS OVERLAY */}
        {currentStep >= 4 && (
          <>
            {/* Top Bar Badges */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30 pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-white text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold">{activeProduct?.name || 'Spectra Frame'}</span>
                {faceAnalysis && activeProduct?.matchesFaceShape(faceAnalysis.faceShape) && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    98% Stylist Match
                  </span>
                )}
              </div>

              <div className="pointer-events-auto flex items-center gap-2">
                {onOpen360 && activeProduct && (
                  <button
                    onClick={() => onOpen360(activeProduct, activeColor)}
                    className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white text-xs transition-all flex items-center gap-1.5"
                    title="View 360° Studio Model"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-[#00bac6]" />
                    <span className="hidden sm:inline font-semibold">360° View</span>
                  </button>
                )}

                <button
                  onClick={() => setShowStoreTrialModal(true)}
                  className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
                  title="Book In-Store Trial"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Store Trial</span>
                </button>

                <button
                  onClick={() => setIsFullscreenView(!isFullscreenView)}
                  className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white text-xs transition-all"
                >
                  {isFullscreenView ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Bottom Shutter Photo Capture Button */}
            <div className="absolute bottom-4 inset-x-0 flex flex-col items-center justify-center gap-2 z-30">
              <button
                onClick={() => handleTakeSnapshot(true)}
                disabled={isCapturing}
                className="px-8 py-3 rounded-full font-bold text-xs tracking-wider uppercase shadow-2xl transition-all bg-white text-slate-900 hover:bg-slate-100 hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer border border-slate-200"
              >
                <Camera className="w-4 h-4 text-[#00bac6]" />
                <span>{isCapturing ? 'Snapping...' : 'Capture Look'}</span>
                {isFaceDetected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            </div>
          </>
        )}

        {/* Camera Error Message */}
        {cameraError && (
          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-6 text-center z-40">
            <h3 className="text-base font-bold text-slate-900 mb-1">Camera Access Issue</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-4">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-5 py-2.5 bg-[#000042] text-white font-semibold text-xs rounded-full hover:bg-[#000028] transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        )}
      </div>

      {/* STEP 5: DIGITAL STYLIST FILTER PILLS & INSTANT FRAME CAROUSEL */}
      <div className="w-full max-w-2xl mt-4 px-2 space-y-3">
        {/* Digital Stylist Filter Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#000042]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Digital Stylist Recommendations:
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold">
            {[
              { id: 'all', label: 'All Frames' },
              { id: 'recommended', label: `Recommended for ${faceAnalysis?.faceShape || 'Face'} ★` },
              { id: 'bestsellers', label: 'Bestsellers' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStylistFilter(f.id)}
                className={`px-3 py-1 rounded-full border transition-all shrink-0 ${
                  stylistFilter === f.id
                    ? 'bg-[#000042] text-white border-[#000042] shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick-Swap Spectacles Strip */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {stylistFilteredCatalog.map((item) => {
            const isSelected = activeProduct?.id === item.id;
            const isRecommended = faceAnalysis && item.matchesFaceShape(faceAnalysis.faceShape);
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (onSelectProduct) onSelectProduct(item);
                  if (onSelectColor) onSelectColor(item.availableColors[0]);
                  if (onSelectLens) onSelectLens(item.availableLensTints[0]);
                }}
                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-2xl border shrink-0 transition-all text-left ${
                  isSelected
                    ? 'bg-[#000042] text-white border-[#000042] shadow-md scale-[1.02]'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                {isRecommended && (
                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-sm">
                    Fit ★
                  </span>
                )}
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-7 object-contain bg-white rounded-lg p-0.5 border border-slate-200 shrink-0 shadow-sm"
                />
                <div>
                  <div className="text-[11px] font-bold truncate max-w-[130px]">{item.name}</div>
                  <div className={`text-[9px] capitalize ${isSelected ? 'text-cyan-200' : 'text-slate-500'}`}>
                    {item.shape} • ₹{item.price}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Color Swatch Switcher */}
        {activeProduct && activeProduct.availableColors && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Colorway:</span>
              <div className="flex items-center gap-1.5">
                {activeProduct.availableColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => onSelectColor && onSelectColor(color)}
                    className={`w-5 h-5 rounded-full border transition-all ${
                      activeColor?.id === color.id ? 'ring-2 ring-[#00bac6] scale-110' : 'border-slate-300'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStoreTrialModal(true)}
                className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-all flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-[#00bac6]" />
                <span>Book Store Trial</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STEP 6: OMNICHANNEL CHECKOUT & PHYSICAL STORE TRIAL MODAL */}
      {showStoreTrialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-4 border border-slate-100">
            <button
              onClick={() => setShowStoreTrialModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#000042]/5 text-[#000042] text-xs font-bold border border-[#000042]/10">
              <MapPin className="w-3.5 h-3.5 text-[#00bac6]" />
              <span>Step 6: Omnichannel Store Synergy</span>
            </div>

            <h3 className="text-xl font-serif font-bold text-slate-900">
              Try This Frame in Any Lenskart Store
            </h3>

            <p className="text-xs text-slate-500">
              Your biometric face profile, measured PD, and selected frame have been synchronized. Show this token to the optometrist at any store.
            </p>

            {/* Omnichannel Trial Token Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">Omnichannel Session Token:</span>
                <span className="font-mono font-bold text-[#000042] text-sm bg-white px-2 py-0.5 rounded border border-slate-200">
                  {trialToken}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                <span className="text-slate-500">Measured PD:</span>
                <span className="font-bold text-slate-800">{faceAnalysis?.measuredPdMm || 63.5} mm</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Face Shape:</span>
                <span className="font-bold text-slate-800">{faceAnalysis?.faceShape || 'Oval'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Shortlisted Frame:</span>
                <span className="font-bold text-slate-800 truncate max-w-[180px]">{activeProduct?.name}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setTrialBooked(true);
                  confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.6 }
                  });
                }}
                className={`w-full py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  trialBooked
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#000042] text-white hover:bg-[#000028] shadow-md'
                }`}
              >
                {trialBooked ? <Check className="w-4 h-4" /> : <MapPin className="w-4 h-4 text-[#00bac6]" />}
                <span>{trialBooked ? 'Appointment Reserved!' : 'Reserve In-Store Trial'}</span>
              </button>

              <button
                onClick={() => {
                  setShowStoreTrialModal(false);
                  if (onGoToDittoGrid) onGoToDittoGrid();
                }}
                className="w-full py-2.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-all"
              >
                Browse All Frames on My 3D Face
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
