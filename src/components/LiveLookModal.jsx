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
  AlertTriangle
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
  const [isLandmarkerReady, setIsLandmarkerReady] = useState(false);

  // Smoothed 3D Pose parameters (Exponential Moving Average for 60 FPS zero-jitter tracking)
  const smoothedPoseRef = useRef({
    x: 50.0,
    y: 47.5,
    width: 38.0,
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

  // Stop camera tracks and cancel RAF loop
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
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

    const loop = () => {
      animFrameIdRef.current = requestAnimationFrame(loop);

      const video = videoRef.current;
      const container = containerRef.current;
      const overlay = specsOverlayRef.current;
      const leftTemple = leftTempleRef.current;
      const rightTemple = rightTempleRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !container || !overlay || video.readyState < 2) return;

      // Ensure timestamp strictly increases for MediaPipe
      const ts = performance.now();
      if (ts <= lastTimestampRef.current) return;
      lastTimestampRef.current = ts;

      if (landmarker) {
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

            // Update 3D temple arms (behind ear strands) to follow head yaw dynamically
            if (leftTemple) {
              const leftYaw = -72 - (s.yaw * 0.7);
              const leftOpacity = Math.max(0.68, Math.min(1.0, 0.88 - (s.yaw * 0.015)));
              leftTemple.style.transform = `rotateY(${leftYaw.toFixed(2)}deg) translateZ(-4px)`;
              leftTemple.style.opacity = leftOpacity.toFixed(2);
            }
            if (rightTemple) {
              const rightYaw = 72 - (s.yaw * 0.7);
              const rightOpacity = Math.max(0.68, Math.min(1.0, 0.88 + (s.yaw * 0.015)));
              rightTemple.style.transform = `rotateY(${rightYaw.toFixed(2)}deg) translateZ(-4px)`;
              rightTemple.style.opacity = rightOpacity.toFixed(2);
            }

            setIsFaceDetected(true);
          } else {
            setIsFaceDetected(false);
          }
        } catch (e) {
          // Frame drop safe
        }
      } else {
        // Fallback: If landmarker still loading, show spectacles centered on screen
        overlay.style.opacity = '1';
        overlay.style.left = '50%';
        overlay.style.top = '48%';
        overlay.style.width = '38%';
        overlay.style.transform = 'translate(-50%, -50%)';
      }
    };

    loop();
  }, []);

  // Start Live Camera IMMEDIATELY, then initialize MediaPipe in parallel
  const startCamera = useCallback(async () => {
    stopCamera();
    setIsCameraStarting(true);
    setCameraError(null);

    try {
      console.log('🎥 [LiveLookModal] Starting camera request...');
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      // 4-second timeout to detect if Windows webcam is locked exclusively by another tab (e.g. VirtualTryOn tab)
      const getUserMediaPromise = navigator.mediaDevices.getUserMedia(constraints);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('CAMERA_TIMEOUT')), 4000)
      );

      const stream = await Promise.race([getUserMediaPromise, timeoutPromise]);
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;

        // Play video
        const playPromise = video.play();
        if (playPromise !== undefined) {
          await playPromise.catch(e => console.warn('Video play warning:', e));
        }
        startDetectionLoop();
      }
      setIsCameraStarting(false);

      // 2. Load MediaPipe FaceLandmarker in parallel (does NOT block camera rendering!)
      if (!landmarkerRef.current) {
        try {
          const landmarker = await createFaceLandmarker();
          landmarkerRef.current = landmarker;
          setIsLandmarkerReady(true);
        } catch (lmErr) {
          console.warn('FaceLandmarker network load failed, using baseline fitting:', lmErr);
        }
      } else {
        setIsLandmarkerReady(true);
      }

    } catch (err) {
      console.error('Camera initialization failed:', err);
      setIsCameraStarting(false);

      const errName = err?.name || '';
      if (err?.message === 'CAMERA_TIMEOUT' || errName === 'NotReadableError' || errName === 'TrackStartError') {
        setCameraError('Your webcam is currently locked by another tab (e.g. your "3D Virtual Try-On" tab with the red recording dot). Please close that tab or click "Switch to Photo View" below.');
      } else if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setCameraError('Camera access was denied. Please click the camera/lock icon in your browser address bar to allow camera access, then click Retry.');
      } else {
        setCameraError('Camera access unavailable. Please grant camera permission or close other camera tabs.');
      }
    }
  }, [stopCamera, startDetectionLoop]);

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
        } catch (e) {}
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

    let startColor = '#18181b';
    let midColor = '#27272a';
    let endColor = '#09090b';
    let accentColor = '#d4af37';
    let thickness = 5.2;

    if (isRoseGold) {
      startColor = '#b76e79';
      midColor = '#f43f5e';
      endColor = '#881337';
      accentColor = '#fda4af';
      thickness = 3.4;
    } else if (isTortoise) {
      startColor = '#45220c';
      midColor = '#6b3714';
      endColor = '#2e1405';
      accentColor = '#d4af37';
      thickness = 5.2;
    } else if (isMetal || shape === 'aviator') {
      startColor = '#ffd700';
      midColor = '#fef08a';
      endColor = '#b45309';
      accentColor = '#ffd700';
      thickness = 3.2;
    } else if (shape === 'clubmaster') {
      // Clubmaster browline: glossy black acetate temple with gold hinge rivet
      startColor = '#111827';
      midColor = '#1f2937';
      endColor = '#030712';
      accentColor = '#ffd700';
      thickness = 5.2;
    } else if (colorHex === '#e2e8f0' || colorHex === '#ffffff') {
      startColor = '#cbd5e1';
      midColor = '#f8fafc';
      endColor = '#94a3b8';
      accentColor = '#e2e8f0';
      thickness = 4.2;
    }

    let hingeTopPct = 25;
    if (shape === 'clubmaster' || shape === 'wayfarer') hingeTopPct = 23;
    else if (shape === 'aviator') hingeTopPct = 30;
    else if (shape === 'round') hingeTopPct = 28;

    return { startColor, midColor, endColor, accentColor, thickness, hingeTopPct, isMetal };
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
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
          className="relative flex-1 w-full min-h-[420px] sm:min-h-[500px] h-[500px] bg-slate-950 flex items-center justify-center overflow-hidden select-none"
        >
          {tryOnMode === 'camera' ? (
            /* ================= LIVE WEBCAM AR STREAM ================= */
            <>
              {/* Mirrored Live Video Feed */}
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* 3D Real-Time Eyewear Superimposition Overlay */}
              <div
                ref={specsOverlayRef}
                className="absolute pointer-events-none will-change-transform z-10 transition-opacity duration-150"
                style={{
                  left: '50%',
                  top: '48%',
                  width: '38%',
                  transform: 'translate(-50%, -50%)',
                  transformStyle: 'preserve-3d',
                  perspective: '1200px'
                }}
              >
                {/* Left 3D Temple Arm (Strand reaching back & hooking behind ear) */}
                <div
                  ref={leftTempleRef}
                  className="absolute origin-left pointer-events-none transition-all duration-100 z-0"
                  style={{
                    left: '0.5%',
                    top: `${templeMeta.hingeTopPct}%`,
                    width: '64%',
                    height: '38px',
                    transform: 'rotateY(-72deg) translateZ(-4px)',
                    transformOrigin: 'left center',
                    opacity: 0.9,
                    filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.45))'
                  }}
                >
                  <svg
                    viewBox="0 0 150 38"
                    className="w-full h-full overflow-visible"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id={`left-temple-grad-${activeProduct.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={templeMeta.startColor} />
                        <stop offset="45%" stopColor={templeMeta.midColor} />
                        <stop offset="100%" stopColor={templeMeta.endColor} />
                      </linearGradient>
                    </defs>
                    {/* Metal hinge joint barrel */}
                    <rect x="0" y="2" width="5" height={templeMeta.thickness + 2} rx="1" fill={templeMeta.accentColor} />
                    {/* Temple shaft with downward ergonomic ear hook */}
                    <path
                      d={`M 4 ${4 + templeMeta.thickness / 2} L 100 ${4 + templeMeta.thickness / 2} Q 125 ${4 + templeMeta.thickness / 2} 136 19 Q 144 29 148 34`}
                      stroke={`url(#left-temple-grad-${activeProduct.id})`}
                      strokeWidth={templeMeta.thickness}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Padded ear tip cushion */}
                    <circle cx="148" cy="34" r={templeMeta.thickness / 2 + 0.5} fill={templeMeta.endColor} />
                  </svg>
                </div>

                {/* Right 3D Temple Arm (Strand reaching back & hooking behind ear) */}
                <div
                  ref={rightTempleRef}
                  className="absolute origin-right pointer-events-none transition-all duration-100 z-0"
                  style={{
                    right: '0.5%',
                    top: `${templeMeta.hingeTopPct}%`,
                    width: '64%',
                    height: '38px',
                    transform: 'rotateY(72deg) translateZ(-4px)',
                    transformOrigin: 'right center',
                    opacity: 0.9,
                    filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.45))'
                  }}
                >
                  <svg
                    viewBox="0 0 150 38"
                    className="w-full h-full overflow-visible"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id={`right-temple-grad-${activeProduct.id}`} x1="100%" y1="0%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor={templeMeta.startColor} />
                        <stop offset="45%" stopColor={templeMeta.midColor} />
                        <stop offset="100%" stopColor={templeMeta.endColor} />
                      </linearGradient>
                    </defs>
                    {/* Metal hinge joint barrel */}
                    <rect x="145" y="2" width="5" height={templeMeta.thickness + 2} rx="1" fill={templeMeta.accentColor} />
                    {/* Temple shaft with downward ergonomic ear hook */}
                    <path
                      d={`M 146 ${4 + templeMeta.thickness / 2} L 50 ${4 + templeMeta.thickness / 2} Q 25 ${4 + templeMeta.thickness / 2} 14 19 Q 6 29 2 34`}
                      stroke={`url(#right-temple-grad-${activeProduct.id})`}
                      strokeWidth={templeMeta.thickness}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Padded ear tip cushion */}
                    <circle cx="2" cy="34" r={templeMeta.thickness / 2 + 0.5} fill={templeMeta.endColor} />
                  </svg>
                </div>

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
                      <span>Align Face to Camera</span>
                    </>
                  )}
                </div>

                {isFaceDetected && (
                  <div className="px-2.5 py-0.5 rounded-md bg-black/45 backdrop-blur-sm text-[10px] text-slate-300">
                    Turn head left or right to inspect fit
                  </div>
                )}
              </div>

              {/* Camera Error Modal Overlay if camera blocked or held by another tab */}
              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white z-30">
                  <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold mb-1">Webcam In Use or Blocked</h4>
                  <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
                    {cameraError}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={startCamera}
                      className="px-5 py-2.5 rounded-full bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-all flex items-center gap-2 shadow-md cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Camera</span>
                    </button>
                    {userSelfie && (
                      <button
                        onClick={() => setTryOnMode('photo')}
                        className="px-5 py-2.5 rounded-full bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all border border-white/20 cursor-pointer"
                      >
                        Switch to Photo View
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
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
                  style={{
                    ...getStaticFittingStyle(activeProduct),
                    transformStyle: 'preserve-3d',
                    perspective: '1200px'
                  }}
                >
                  {/* Left Temple Strand */}
                  <div
                    className="absolute origin-left pointer-events-none z-0"
                    style={{
                      left: '0.5%',
                      top: `${templeMeta.hingeTopPct}%`,
                      width: '64%',
                      height: '38px',
                      transform: 'rotateY(-72deg) translateZ(-4px)',
                      transformOrigin: 'left center',
                      opacity: 0.9,
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))'
                    }}
                  >
                    <svg viewBox="0 0 150 38" className="w-full h-full overflow-visible" fill="none">
                      <rect x="0" y="2" width="5" height={templeMeta.thickness + 2} rx="1" fill={templeMeta.accentColor} />
                      <path
                        d={`M 4 ${4 + templeMeta.thickness / 2} L 100 ${4 + templeMeta.thickness / 2} Q 125 ${4 + templeMeta.thickness / 2} 136 19 Q 144 29 148 34`}
                        stroke={templeMeta.startColor}
                        strokeWidth={templeMeta.thickness}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="148" cy="34" r={templeMeta.thickness / 2 + 0.5} fill={templeMeta.endColor} />
                    </svg>
                  </div>

                  {/* Right Temple Strand */}
                  <div
                    className="absolute origin-right pointer-events-none z-0"
                    style={{
                      right: '0.5%',
                      top: `${templeMeta.hingeTopPct}%`,
                      width: '64%',
                      height: '38px',
                      transform: 'rotateY(72deg) translateZ(-4px)',
                      transformOrigin: 'right center',
                      opacity: 0.9,
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))'
                    }}
                  >
                    <svg viewBox="0 0 150 38" className="w-full h-full overflow-visible" fill="none">
                      <rect x="145" y="2" width="5" height={templeMeta.thickness + 2} rx="1" fill={templeMeta.accentColor} />
                      <path
                        d={`M 146 ${4 + templeMeta.thickness / 2} L 50 ${4 + templeMeta.thickness / 2} Q 25 ${4 + templeMeta.thickness / 2} 14 19 Q 6 29 2 34`}
                        stroke={templeMeta.startColor}
                        strokeWidth={templeMeta.thickness}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="2" cy="34" r={templeMeta.thickness / 2 + 0.5} fill={templeMeta.endColor} />
                    </svg>
                  </div>

                  <img
                    src={activeCutoutImage}
                    alt={activeProduct.name}
                    className="w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)] transition-transform duration-200 animate-in fade-in zoom-in-95 relative z-10"
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
                  className="mt-2 px-6 py-2.5 rounded-full bg-[#00bac6] hover:bg-[#00a1ad] active:scale-95 text-[#000042] font-bold text-xs transition-all flex items-center justify-center gap-2 mx-auto shadow-md cursor-pointer"
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
                        className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
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
                  className={`relative shrink-0 w-16 h-14 rounded-xl border p-1 transition-all flex flex-col items-center justify-center bg-[#f9fafb] cursor-pointer ${
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
                className="px-4 py-2 rounded-full border border-slate-900 text-slate-900 text-xs font-bold hover:bg-slate-900 hover:text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>360° View</span>
              </button>
            )}

            <button
              onClick={() => {
                if (onAddToCart) onAddToCart(activeProduct);
              }}
              className="px-5 py-2 rounded-full bg-[#000042] text-white text-xs font-bold hover:bg-[#000028] transition-all flex items-center gap-1.5 shadow-md uppercase tracking-wider cursor-pointer"
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
