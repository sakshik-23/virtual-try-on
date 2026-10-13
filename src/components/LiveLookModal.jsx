import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  ShoppingBag,
  Sparkles,
  Camera,
  Video,
  RefreshCw,
  Check,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { EYEWEAR_CATALOG } from '../services/catalogData';
import { createFaceLandmarker } from '../services/faceLandmarkerService';
import { calculateHeadPose } from '../services/faceGeometry';

export function LiveLookModal({
  isOpen,
  onClose,
  initialProduct,
  catalogProducts = EYEWEAR_CATALOG,
  userSelfie = null,
  faceMetrics = null,
  onAddToCart,
  onOpen360
}) {
  if (!isOpen) return null;

  const navigate = useNavigate();
  const productList = catalogProducts && catalogProducts.length > 0 ? catalogProducts : EYEWEAR_CATALOG;

  // Try-on mode: 'camera' (Live Webcam AR) or 'photo' (Static 3D Avatar Photo)
  const [tryOnMode, setTryOnMode] = useState('camera');

  // Active product index
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!initialProduct) return 0;
    const idx = productList.findIndex(p => String(p.id) === String(initialProduct.id) || p.sku === initialProduct.sku);
    return idx >= 0 ? idx : 0;
  });

  // Always update currentIndex whenever a user selects a product from catalog
  useEffect(() => {
    if (initialProduct && productList.length > 0) {
      const idx = productList.findIndex(p => String(p.id) === String(initialProduct.id) || p.sku === initialProduct.sku);
      if (idx >= 0) {
        setCurrentIndex(idx);
        if (productList[idx]?.availableColors?.length) {
          setSelectedColor(productList[idx].availableColors[0]);
        }
      }
    }
  }, [initialProduct, productList]);

  const activeProduct = productList[currentIndex] || productList[0];
  const [selectedColor, setSelectedColor] = useState(activeProduct.availableColors?.[0] || null);

  // Sync color when active product changes
  useEffect(() => {
    if (activeProduct?.availableColors?.length) {
      setSelectedColor(activeProduct.availableColors[0]);
    }
  }, [activeProduct]);

  // Camera & Face Tracking State
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const specsOverlayRef = useRef(null);
  const leftTempleRef = useRef(null);
  const rightTempleRef = useRef(null);

  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const lastTimestampRef = useRef(-1);

  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  // Smoothed 3D Pose parameters (Exponential Moving Average for 60 FPS zero-jitter tracking)
  const smoothedPoseRef = useRef({
    x: 50.0,
    y: 47.5,
    width: 37.0,
    yaw: 0.0,
    pitch: 0.0,
    roll: 0.0
  });

  // Keep track of activeProduct for the animation loop
  const activeProductRef = useRef(activeProduct);
  useEffect(() => {
    activeProductRef.current = activeProduct;
  }, [activeProduct]);

  // Touch & Pointer Swipe Handling (Swipe left/right to change specs dynamically!)
  const swipeStartXRef = useRef(null);
  const swipeStartYRef = useRef(null);

  const handlePointerDown = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    swipeStartXRef.current = clientX;
    swipeStartYRef.current = clientY;
  };

  const handlePointerUp = (e) => {
    if (swipeStartXRef.current === null) return;
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const diffX = swipeStartXRef.current - clientX;
    const diffY = (swipeStartYRef.current || clientY) - clientY;

    // Detect horizontal swipe
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) handleNext(); // Swiped left -> Next specs
      else handlePrev(); // Swiped right -> Prev specs
    }
    swipeStartXRef.current = null;
    swipeStartYRef.current = null;
  };

  // Keyboard navigation (Left / Right arrow keys to switch specs dynamically!)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, productList]);

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % productList.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + productList.length) % productList.length);
  };

  // Start Live Camera AR Stream & 60 FPS Face Landmarker
  const startCamera = useCallback(async () => {
    stopCamera();
    setIsCameraStarting(true);
    setCameraError(null);

    try {
      // 1. Initialize MediaPipe FaceLandmarker
      if (!landmarkerRef.current) {
        landmarkerRef.current = await createFaceLandmarker();
      }

      // 2. Request user media video stream
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        const playAndLoop = () => {
          videoRef.current?.play().catch(e => console.warn('Video play warning:', e));
          startDetectionLoop();
        };

        if (videoRef.current.readyState >= 2) {
          playAndLoop();
        } else {
          videoRef.current.onloadedmetadata = playAndLoop;
          videoRef.current.onloadeddata = playAndLoop;
        }
      }
      setIsCameraStarting(false);
    } catch (err) {
      console.error('Camera initialization failed:', err);
      setIsCameraStarting(false);
      setCameraError('Camera access unavailable. Please grant camera permission to try spectacles live.');
    }
  }, []);

  // Stop camera tracks and cancel RAF loop
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsFaceDetected(false);
  }, []);

  // 60 FPS Real-time Detection Loop
  const startDetectionLoop = useCallback(() => {
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);

    const loop = (now) => {
      animFrameIdRef.current = requestAnimationFrame(loop);

      const video = videoRef.current;
      const container = containerRef.current;
      const overlay = specsOverlayRef.current;
      const leftTemple = leftTempleRef.current;
      const rightTemple = rightTempleRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !container || !overlay || video.readyState < 2 || !landmarker) return;

      // Ensure timestamp strictly increases
      const ts = performance.now();
      if (ts <= lastTimestampRef.current) return;
      lastTimestampRef.current = ts;

      try {
        const results = landmarker.detectForVideo(video, ts);

        if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];

          const videoW = video.videoWidth || 1280;
          const videoH = video.videoHeight || 720;
          const containerW = container.clientWidth || 640;
          const containerH = container.clientHeight || 480;

          // Compute exact object-cover displayed coordinates
          const scale = Math.max(containerW / videoW, containerH / videoH);
          const displayedW = videoW * scale;
          const displayedH = videoH * scale;
          const offsetX = (containerW - displayedW) / 2;
          const offsetY = (containerH - displayedH) / 2;

          // Upper nasal bridge landmark (168 is Nasion between eyes; 6 is nasal root)
          const noseBridge = landmarks[168] || landmarks[6] || landmarks[1];

          // Mirror video horizontally (scaleX(-1)): flip normalized x
          const videoPixelX = (1 - noseBridge.x) * videoW;
          const videoPixelY = noseBridge.y * videoH;

          const containerPixelX = offsetX + videoPixelX * scale;
          const containerPixelY = offsetY + videoPixelY * scale;

          const targetX = (containerPixelX / containerW) * 100;

          // Slight anatomical vertical offset according to frame geometry
          const currentProd = activeProductRef.current;
          const shape = currentProd?.shape || 'wayfarer';
          const yOffsetPct = shape === 'aviator' ? 1.6 : shape === 'round' ? 0.8 : 1.1;
          const targetY = (containerPixelY / containerH) * 100 + yOffsetPct;

          // Compute Pupillary Distance (IPD) / temple distance in pixels
          const leftIris = landmarks[473] || landmarks[263];
          const rightIris = landmarks[468] || landmarks[33];
          const rawIpd = Math.hypot(leftIris.x - rightIris.x, leftIris.y - rightIris.y);
          const ipdPixels = rawIpd * displayedW;

          const frameMm = currentProd?.dimensions?.frameWidth || 138;
          // Adult human baseline IPD is ~63mm. Scale frames realistically:
          const glassesWidthPx = ipdPixels * (frameMm / 63.0);
          const targetWidth = Math.max(22, Math.min(56, (glassesWidthPx / containerW) * 100));

          // Real-time 3D Head Pose
          const pose = calculateHeadPose(landmarks);
          const targetYaw = pose.yaw; // Looking left/right
          const targetPitch = pose.pitch; // Looking up/down
          const targetRoll = pose.roll; // Head tilt

          // Low-Pass Exponential Smoothing (Lerp) for rock-solid 60 FPS motion without jitter
          const alpha = 0.35;
          const s = smoothedPoseRef.current;
          s.x += alpha * (targetX - s.x);
          s.y += alpha * (targetY - s.y);
          s.width += alpha * (targetWidth - s.width);
          s.yaw += alpha * (targetYaw - s.yaw);
          s.pitch += alpha * (targetPitch - s.pitch);
          s.roll += alpha * (targetRoll - s.roll);

          // Direct DOM style manipulation bypassing React reconciliation for pure 60 FPS
          overlay.style.opacity = '1';
          overlay.style.left = `${s.x.toFixed(2)}%`;
          overlay.style.top = `${s.y.toFixed(2)}%`;
          overlay.style.width = `${s.width.toFixed(2)}%`;
          overlay.style.transform = `translate(-50%, -50%) perspective(1200px) rotateY(${s.yaw.toFixed(2)}deg) rotateX(${(-s.pitch).toFixed(2)}deg) rotateZ(${(-s.roll).toFixed(2)}deg)`;

          // Temple arms dynamically angle and reveal when looking left or right
          if (leftTemple) {
            // Turning to screen-left (yaw < -3) reveals left temple extending back to ear
            const leftOpacity = s.yaw < -3 ? Math.min(1, Math.abs(s.yaw) / 18) : 0;
            leftTemple.style.opacity = leftOpacity.toFixed(2);
          }
          if (rightTemple) {
            // Turning to screen-right (yaw > 3) reveals right temple extending back to ear
            const rightOpacity = s.yaw > 3 ? Math.min(1, Math.abs(s.yaw) / 18) : 0;
            rightTemple.style.opacity = rightOpacity.toFixed(2);
          }

          setIsFaceDetected(true);
        } else {
          setIsFaceDetected(false);
        }
      } catch (e) {
        // Frame drop safe
      }
    };

    loop(performance.now());
  }, []);

  // Manage camera lifecycle based on isOpen and tryOnMode
  useEffect(() => {
    if (isOpen && tryOnMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, tryOnMode, startCamera, stopCamera]);

  // Clean up landmarker on complete unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch (e) {
          console.warn('Landmarker close warning:', e);
        }
        landmarkerRef.current = null;
      }
    };
  }, [stopCamera]);

  // Optical static fitting style for 'photo' mode
  const getStaticFittingStyle = (product) => {
    const posX = faceMetrics?.noseBridge?.x != null ? faceMetrics.noseBridge.x * 100 : 50.0;
    const posY = faceMetrics?.noseBridge?.y != null ? faceMetrics.noseBridge.y * 100 : 49.0;
    let rawTilt = faceMetrics?.tiltDeg || 0;
    if (Math.abs(rawTilt) > 15) rawTilt = 0;
    const tilt = Math.max(-8, Math.min(8, rawTilt));

    const frameMm = product.dimensions?.frameWidth || 138;
    const baseWidthPercent = faceMetrics?.ipdRatio && faceMetrics.ipdRatio > 0.08 && faceMetrics.ipdRatio < 0.5
      ? faceMetrics.ipdRatio * (frameMm / 63) * 100 * 1.02
      : 37.0;

    return {
      left: `${posX}%`,
      top: `${posY}%`,
      width: `${baseWidthPercent}%`,
      transform: `translate(-50%, -50%) rotate(${tilt}deg)`,
      transformOrigin: 'center center'
    };
  };

  // Determine temple arms style and hinge position
  const getTempleMeta = (product, color) => {
    const shape = product.shape || '';
    const colorHex = color?.hex || product.availableColors?.[0]?.hex || '#1c1c1e';
    const isMetal = shape === 'aviator' || shape === 'round' || shape === 'hexagonal' || (color?.metalness && color.metalness > 0.4);
    const isTortoise = color?.id === 'tortoise' || (product.name && product.name.toLowerCase().includes('tortoise'));
    const isRoseGold = color?.id === 'rosegold' || colorHex.toLowerCase() === '#b76e79';

    let gradient;
    if (isRoseGold) {
      gradient = 'linear-gradient(90deg, #b76e79, #e8b4b8, #8b4a52)';
    } else if (isTortoise) {
      gradient = 'linear-gradient(90deg, #3d2314, #6e4325, #2b170c)';
    } else if (isMetal) {
      gradient = 'linear-gradient(90deg, #ffd700, #b8860b, #d4af37)';
    } else if (colorHex === '#e2e8f0' || colorHex === '#ffffff') {
      gradient = 'linear-gradient(90deg, rgba(226,232,240,0.85), rgba(255,255,255,0.95))';
    } else {
      gradient = `linear-gradient(90deg, ${colorHex}, #2d3748, #111827)`;
    }

    let hingeTopPct = 28;
    if (shape === 'clubmaster' || shape === 'wayfarer') hingeTopPct = 24;
    else if (shape === 'aviator') hingeTopPct = 32;
    else if (shape === 'round') hingeTopPct = 30;

    return { gradient, hingeTopPct, isMetal };
  };

  const templeMeta = getTempleMeta(activeProduct, selectedColor);
  const activeCutoutImage = activeProduct.frontImage || activeProduct.image;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[96vh]">
        
        {/* Top Header: Navigation & Try-On Mode Switcher */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-100 bg-white shrink-0">
          
          {/* Mode Switcher Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTryOnMode('camera')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                tryOnMode === 'camera'
                  ? 'bg-[#000042] text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Live Camera AR</span>
            </button>

            {userSelfie && (
              <button
                onClick={() => setTryOnMode('photo')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  tryOnMode === 'photo'
                    ? 'bg-[#000042] text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>3D Photo Avatar</span>
              </button>
            )}

            <span className="hidden sm:inline text-xs text-slate-400 font-medium ml-2">
              Frame {currentIndex + 1} of {productList.length}
            </span>
          </div>

          {/* Close Modal Button */}
          <button
            onClick={onClose}
            aria-label="Close Live Try-On"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Stage: Live Webcam AR / Photo Avatar with Dynamically Swapped Eyewear */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}
          className="relative flex-1 bg-slate-950 min-h-[400px] sm:min-h-[500px] flex items-center justify-center overflow-hidden select-none"
        >
          {tryOnMode === 'camera' ? (
            /* ================= LIVE WEBCAM AR STREAM ================= */
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              
              {/* Mirrored Live Video Feed */}
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none"
              />

              {/* 3D Real-Time Eyewear Superimposition Overlay */}
              <div
                ref={specsOverlayRef}
                className="absolute pointer-events-none will-change-transform opacity-0 z-10 transition-opacity duration-150"
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '1200px'
                }}
              >
                {/* 3D Left Temple Arm (Extends back into depth towards ear) */}
                <div
                  ref={leftTempleRef}
                  className="absolute origin-left rounded-r-full pointer-events-none"
                  style={{
                    left: '1%',
                    top: `${templeMeta.hingeTopPct}%`,
                    width: '44%',
                    height: templeMeta.isMetal ? '3px' : '5px',
                    transform: 'rotateY(-86deg)',
                    transformOrigin: 'left center',
                    background: templeMeta.gradient,
                    opacity: 0,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    transition: 'opacity 0.1s ease-out'
                  }}
                />

                {/* 3D Right Temple Arm (Extends back into depth towards ear) */}
                <div
                  ref={rightTempleRef}
                  className="absolute origin-right rounded-l-full pointer-events-none"
                  style={{
                    right: '1%',
                    top: `${templeMeta.hingeTopPct}%`,
                    width: '44%',
                    height: templeMeta.isMetal ? '3px' : '5px',
                    transform: 'rotateY(86deg)',
                    transformOrigin: 'right center',
                    background: templeMeta.gradient,
                    opacity: 0,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    transition: 'opacity 0.1s ease-out'
                  }}
                />

                {/* Eyewear Front Rim Cutout */}
                <img
                  src={activeCutoutImage}
                  alt={activeProduct.name}
                  className="w-full object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.55)] transition-all duration-150"
                />

                {/* Dynamic Specular Anti-Reflective Optical Coating Sheen */}
                <div
                  className="absolute inset-0 rounded-[22%] pointer-events-none opacity-40 mix-blend-screen"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(0,223,196,0.12) 40%, rgba(255,255,255,0) 70%)'
                  }}
                />
              </div>

              {/* Status & Tracking HUD Pill (Top Left) */}
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
                <div className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-2 border border-white/10 shadow-lg">
                  {isFaceDetected ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live 3D AR • Face Locked</span>
                    </>
                  ) : isCameraStarting ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                      <span>Starting Camera...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span>Center Face in Camera</span>
                    </>
                  )}
                </div>

                {isFaceDetected && (
                  <div className="px-2.5 py-0.5 rounded-md bg-black/45 backdrop-blur-sm text-[10px] text-slate-300">
                    Look left or right to inspect 3D fit
                  </div>
                )}
              </div>

              {/* Camera Error Modal Overlay if camera blocked */}
              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white z-30">
                  <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                    <Camera className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold mb-1">Camera Permission Required</h4>
                  <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
                    {cameraError}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={startCamera}
                      className="px-5 py-2.5 rounded-full bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-all flex items-center gap-2 shadow-md"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Camera</span>
                    </button>
                    {userSelfie && (
                      <button
                        onClick={() => setTryOnMode('photo')}
                        className="px-5 py-2.5 rounded-full bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all border border-white/20"
                      >
                        Switch to Photo View
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* ================= STATIC 3D AVATAR PHOTO MODE ================= */
            userSelfie ? (
              <div className="relative w-full h-full max-w-lg aspect-square flex items-center justify-center">
                <img
                  src={userSelfie}
                  alt="Your 3D Avatar"
                  className="w-full h-full object-cover rounded-2xl"
                />
                
                {/* Static Spectacles Superimposition */}
                <div
                  className="absolute pointer-events-none transition-all duration-200"
                  style={getStaticFittingStyle(activeProduct)}
                >
                  <img
                    src={activeCutoutImage}
                    alt={activeProduct.name}
                    className="w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)] transition-transform duration-200 animate-in fade-in zoom-in-95"
                  />
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-2 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>3D Avatar Fit</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-white space-y-4 max-w-md">
                <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#00bac6]" />
                </div>
                <h4 className="text-xl font-serif font-bold">Try on Live Camera</h4>
                <p className="text-xs text-slate-300">
                  Turn on your camera to see these spectacles live on your face in real-time AR!
                </p>
                <div className="w-64 mx-auto p-4 bg-white/5 rounded-2xl border border-white/10">
                  <img
                    src={activeCutoutImage}
                    alt={activeProduct.name}
                    className="w-full object-contain max-h-28 mx-auto drop-shadow-md"
                  />
                </div>
                <button
                  onClick={() => setTryOnMode('camera')}
                  className="mt-2 px-6 py-2.5 rounded-full bg-[#00bac6] hover:bg-[#00a1ad] active:scale-95 text-[#000042] font-bold text-xs transition-all flex items-center justify-center gap-2 mx-auto shadow-md"
                >
                  <Video className="w-4 h-4" />
                  <span>Turn On Live Camera</span>
                </button>
              </div>
            )
          )}

          {/* Left Arrow: Previous Spectacles */}
          <button
            onClick={handlePrev}
            aria-label="Previous Spectacles"
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 hover:scale-105 shadow-xl z-20 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow: Next Spectacles */}
          <button
            onClick={handleNext}
            aria-label="Next Spectacles"
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 hover:scale-105 shadow-xl z-20 cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Floating Eyewear Detail Pill (Bottom of Stage) */}
          <div className="absolute bottom-3 inset-x-3 sm:inset-x-6 max-w-lg mx-auto bg-black/80 backdrop-blur-md px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border border-white/15 text-white flex items-center justify-between shadow-2xl z-20">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#00dfc4] flex items-center gap-2">
                <span>{activeProduct.brand}</span>
                <span>•</span>
                <span>{activeProduct.size} Fit ({activeProduct.dimensions?.frameWidth || 138}mm)</span>
              </div>
              <div className="text-sm font-serif font-bold truncate max-w-[220px] sm:max-w-[280px]">
                {activeProduct.name}
              </div>

              {/* Color options if available */}
              {activeProduct.availableColors?.length > 1 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {activeProduct.availableColors.map((col) => {
                    const isColSelected = selectedColor?.id === col.id;
                    return (
                      <button
                        key={col.id}
                        title={col.name}
                        onClick={() => setSelectedColor(col)}
                        className={`w-3.5 h-3.5 rounded-full transition-transform ${
                          isColSelected ? 'ring-2 ring-white scale-125' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: col.hex }}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className="text-base sm:text-lg font-extrabold text-white">
                ₹{activeProduct.price}
              </span>
              <span className="text-[11px] text-slate-400 line-through ml-1.5">
                ₹{activeProduct.originalPrice}
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Control Dock: Frame Carousel & Actions */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* Thumbnail Carousel of All Glasses (Click any to swap dynamically on live camera!) */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 scrollbar-none w-full sm:w-auto">
            {productList.map((product, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={product.id || product.sku}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative shrink-0 w-16 h-14 rounded-xl border p-1 transition-all flex flex-col items-center justify-center bg-[#f9fafb] ${
                    isSelected
                      ? 'border-[#000042] ring-2 ring-[#000042]/20 shadow-md bg-blue-50/50 scale-105'
                      : 'border-slate-200 hover:border-slate-400 opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={product.frontImage || product.image}
                    alt={product.name}
                    className="w-full h-8 object-contain"
                  />
                  <span className="text-[8px] font-bold text-slate-700 truncate w-full text-center">
                    ₹{product.price}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto justify-end">
            {onOpen360 && (
              <button
                onClick={() => {
                  onClose();
                  onOpen360(activeProduct, selectedColor);
                }}
                className="px-4 py-2 rounded-full border border-slate-900 text-slate-900 text-xs font-bold hover:bg-slate-900 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>360° View</span>
              </button>
            )}

            <button
              onClick={() => {
                if (onAddToCart) onAddToCart(activeProduct);
              }}
              className="px-5 py-2 rounded-full bg-[#000042] text-white text-xs font-bold hover:bg-[#000028] transition-all flex items-center gap-1.5 shadow-md uppercase tracking-wider"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
