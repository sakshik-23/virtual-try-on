import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, Sparkles, X, ChevronRight, Maximize2, Minimize2, Palette, RotateCw } from 'lucide-react';
import { createFaceLandmarker } from '../services/faceLandmarkerService';
import { ThreeGlassesEngine } from '../services/threeGlassesEngine';
import { calculateFacialMetrics, classifyFaceShape } from '../services/faceGeometry';
import { EYEWEAR_CATALOG } from '../services/catalogData';
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
  const [isFullscreenView, setIsFullscreenView] = useState(false);

  const lastVideoTimeRef = useRef(-1);

  // 1. Initialize Three.js Engine with dynamic fresh canvas
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

  // 4. Zero-GC High-Performance Frame Loop
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

            // Update 3D Glasses Pose on face
            engine.updatePose(landmarks, canvasWidth, canvasHeight);
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

  // 5. Take Photo (Matches Screenshot 3 & 4)
  const handleTakePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsCapturing(true);

    try {
      const rawCanvas = document.createElement('canvas');
      rawCanvas.width = video.videoWidth || 1280;
      rawCanvas.height = video.videoHeight || 720;
      const rawCtx = rawCanvas.getContext('2d');
      rawCtx.save();
      rawCtx.translate(rawCanvas.width, 0);
      rawCtx.scale(-1, 1);
      rawCtx.drawImage(video, 0, 0, rawCanvas.width, rawCanvas.height);
      rawCtx.restore();

      const rawPhotoUrl = rawCanvas.toDataURL('image/jpeg', 0.92);
      setCapturedSelfie(rawPhotoUrl);

      // Extract accurate facial geometry metrics for exact eyewear fitting
      let metrics = null;
      if (lastLandmarksRef.current) {
        const lms = lastLandmarksRef.current;
        // The canvas is flipped horizontally for mirror webcam display: x_screen = 1 - landmark.x
        const nose = lms[168] || lms[6];
        const leftIris = lms[468] || lms[33];
        const rightIris = lms[473] || lms[362];
        const leftTemple = lms[234];
        const rightTemple = lms[454];

        const noseX = 1 - nose.x;
        const noseY = nose.y;

        const leftIrisX = 1 - leftIris.x;
        const leftIrisY = leftIris.y;
        const rightIrisX = 1 - rightIris.x;
        const rightIrisY = rightIris.y;

        const dx = rightIrisX - leftIrisX;
        const dy = rightIrisY - leftIrisY;
        const tiltDeg = Math.atan2(dy, dx) * (180 / Math.PI);

        // Face temple-to-temple span in mirrored coordinates
        const faceSpanX = Math.abs((1 - rightTemple.x) - (1 - leftTemple.x));
        const pdSpan = Math.hypot(dx, dy);

        metrics = {
          noseBridge: { x: noseX, y: noseY },
          tiltDeg,
          faceSpanX,
          pdSpan
        };
      } else {
        // High-precision calibrated portrait default
        metrics = {
          noseBridge: { x: 0.495, y: 0.535 },
          tiltDeg: 0,
          faceSpanX: 0.38,
          pdSpan: 0.17
        };
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#000042', '#00bac6', '#dfa64c']
      });

      if (onPhotoCaptured) {
        onPhotoCaptured(rawPhotoUrl, metrics);
      }

      setShowSuccessModal(true);
    } catch (e) {
      console.error('Snapshot capture failed:', e);
    } finally {
      setIsCapturing(false);
    }
  }, [onPhotoCaptured]);

  return (
    <div className={`w-full mx-auto flex flex-col items-center py-2 transition-all duration-300 ${
      isFullscreenView ? 'max-w-6xl' : 'max-w-4xl'
    }`}>
      {/* Top Instruction Prompt */}
      <div className="text-center mb-4 max-w-xl">
        <p className="text-[11px] sm:text-[12px] font-bold text-slate-400 tracking-wider uppercase leading-relaxed">
          FACE A LIGHT SOURCE, ALIGN YOUR FACE, TAKE OFF YOUR GLASSES, AND TUCK YOUR HAIR BEHIND YOUR EARS
        </p>
      </div>

      {/* Main Viewport Container */}
      <div className={`relative w-full rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border border-slate-200 transition-all duration-300 ${
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

        {/* Three.js AR Overlay Canvas */}
        <div
          ref={containerRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Flash effect on capture */}
        {isCapturing && (
          <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-300 pointer-events-none" />
        )}

        {/* Facial Calibration Oval Guide */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div
            className={`w-64 h-80 sm:w-72 sm:h-96 rounded-[50%] border-[3px] border-dashed transition-all duration-300 ${
              isFaceDetected
                ? 'border-[#00bac6] shadow-[0_0_35px_rgba(0,186,198,0.35)]'
                : 'border-white/60 animate-pulse'
            }`}
          />
        </div>

        {/* Top Controls: Entire View / Fullscreen Toggle + Active Frame Badge */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">{activeProduct?.name || 'Spectra Frame'}</span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            {onOpenStyleQuiz && (
              <button
                onClick={onOpenStyleQuiz}
                className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white text-xs transition-all flex items-center gap-1.5"
                title="AI Style & Outfit Matcher"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#00bac6]" />
                <span className="hidden sm:inline font-semibold">Style Matcher</span>
              </button>
            )}

            {onOpen360 && activeProduct && (
              <button
                onClick={() => onOpen360(activeProduct, activeColor)}
                className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white text-xs transition-all flex items-center gap-1.5"
                title="Open 360° View"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">360°</span>
              </button>
            )}

            <button
              onClick={() => setIsFullscreenView(!isFullscreenView)}
              className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white text-xs transition-all"
              title={isFullscreenView ? 'Standard View' : 'Entire View (Expanded)'}
            >
              {isFullscreenView ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 180° Head Turn Helper Prompt */}
        <div className="absolute top-16 inset-x-0 flex justify-center pointer-events-none z-20">
          <div className="text-[10px] text-white/90 bg-black/50 backdrop-blur-md px-3.5 py-1 rounded-full uppercase tracking-wider font-semibold border border-white/10">
            180° 3D Fit: Turn head left or right to inspect profile angles
          </div>
        </div>

        {/* Bottom Shutter Overlay Button */}
        <div className="absolute bottom-5 inset-x-0 flex flex-col items-center justify-center gap-2 z-30">
          <button
            onClick={handleTakePhoto}
            disabled={isCapturing}
            className="px-8 py-3.5 rounded-full font-bold text-xs tracking-wider uppercase shadow-2xl transition-all bg-white text-slate-900 hover:bg-slate-100 hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer border border-slate-200"
          >
            <Camera className="w-4 h-4 text-[#00bac6]" />
            <span>{isCapturing ? 'Capturing 3D Fit...' : 'Take Photo'}</span>
            {isFaceDetected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Face Position Locked" />
            )}
          </button>
        </div>

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

      {/* QUICK HORIZONTAL SPECTACLES DRAWER: Easy on-screen 1-click swapping (Matches Lenskart ease-of-use!) */}
      <div className="w-full max-w-2xl mt-4 px-2">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="font-bold uppercase tracking-wider text-slate-700">Quick Try Different Spectacles:</span>
          <span className="text-[11px]">Click any frame to swap in real-time</span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {EYEWEAR_CATALOG.map((item) => {
            const isSelected = activeProduct?.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (onSelectProduct) onSelectProduct(item);
                  if (onSelectColor) onSelectColor(item.availableColors[0]);
                  if (onSelectLens) onSelectLens(item.availableLensTints[0]);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl border shrink-0 transition-all text-left ${
                  isSelected
                    ? 'bg-[#000042] text-white border-[#000042] shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                {/* Real Product Thumbnail Image */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-11 h-7 object-contain bg-white rounded-lg p-0.5 border border-slate-200 shrink-0 shadow-sm"
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

        {/* Live Colorway Dots */}
        {activeProduct && activeProduct.availableColors && (
          <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500">Colorway:</span>
            <div className="flex items-center gap-2">
              {activeProduct.availableColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => onSelectColor && onSelectColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                    activeColor?.id === color.id ? 'border-[#000042] scale-110 shadow-sm' : 'border-transparent'
                  }`}
                  title={color.name}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/10"
                    style={{ backgroundColor: color.hex }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Success Modal (Matching Screenshot 3) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl text-center space-y-5 border border-slate-100">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-28 h-28 rounded-full overflow-hidden mx-auto border-4 border-[#00bac6] shadow-lg">
              <img
                src={capturedSelfie}
                alt="Your 3D Avatar"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-serif font-bold text-slate-900">
                Your 3D has been successfully created!
              </h3>
              <p className="text-xs text-slate-500">
                You can now browse multiple spectacles on your face automatically.
              </p>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                if (onGoToDittoGrid) onGoToDittoGrid();
              }}
              className="w-full py-3.5 rounded-full bg-[#000042] text-white font-bold text-sm hover:bg-[#000028] shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>View frames in 3D</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
