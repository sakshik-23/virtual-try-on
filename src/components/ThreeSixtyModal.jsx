import React, { useEffect, useRef, useState } from 'react';
import { X, RotateCw, Sparkles, Compass, Play, Pause, ZoomIn, ZoomOut, Eye, Layers } from 'lucide-react';

export function ThreeSixtyModal({
  isOpen,
  onClose,
  product,
  selectedColor,
  onTryOn
}) {
  const [angle, setAngle] = useState(45); // Start at 45° (iconic 3/4 studio angle)
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [activeColor, setActiveColor] = useState(selectedColor);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartAngle, setDragStartAngle] = useState(45);

  const containerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Sync activeColor when prop changes
  useEffect(() => {
    if (selectedColor) {
      setActiveColor(selectedColor);
    } else if (product?.availableColors?.length) {
      setActiveColor(product.availableColors[0]);
    }
  }, [selectedColor, product]);

  // Reset to natural 3/4 studio view when modal opens
  useEffect(() => {
    if (isOpen) {
      setAngle(45);
      setIsAutoRotating(true);
      setZoomLevel(1);
    }
  }, [isOpen, product]);

  // Smooth continuous auto-rotation loop
  useEffect(() => {
    if (!isOpen || !isAutoRotating || isDragging) return;

    let lastTime = performance.now();
    const rotateLoop = (currentTime) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setAngle((prev) => (prev + delta * 24) % 360);
      animFrameRef.current = requestAnimationFrame(rotateLoop);
    };

    animFrameRef.current = requestAnimationFrame(rotateLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, isAutoRotating, isDragging]);

  // Mouse & Touch Drag Handlers for 360 Turntable Scrubbing
  const handlePointerDown = (e) => {
    setIsDragging(true);
    setIsAutoRotating(false);
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    setDragStartX(clientX);
    setDragStartAngle(angle);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const deltaX = clientX - dragStartX;
    // 1 pixel drag = 0.7 degrees rotation
    const newAngle = (dragStartAngle + deltaX * 0.7 + 720) % 360;
    setAngle(newAngle);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoom = (direction) => {
    if (direction === 'in') {
      setZoomLevel((prev) => Math.min(prev + 0.25, 2.0));
    } else {
      setZoomLevel((prev) => Math.max(prev - 0.25, 0.85));
    }
  };

  if (!isOpen || !product) return null;

  // Determine current perspective view based on rotation angle:
  // 0° -> Front view
  // 45° -> Iconic 3/4 Studio View (Card image)
  // 315° -> Opposite 3/4 Studio View
  // Normalized angle between 0 and 360
  const normalizedAngle = ((angle % 360) + 360) % 360;

  // Select optimal image asset for current angle:
  // Front angle zone (340° to 20°): Front cutout
  // 3/4 Right zone (20° to 170°): Exact studio photo
  // 3/4 Left zone (190° to 340°): Inverted opposite 3/4 studio photo
  // Rear zone (170° to 190°): Rear view
  const isFrontZone = normalizedAngle >= 345 || normalizedAngle <= 15;
  const isOppositeZone = normalizedAngle > 180 && normalizedAngle < 345;

  let currentImageSrc = product.image;
  let transformMirror = false;

  if (isFrontZone && product.frontImage) {
    currentImageSrc = product.frontImage;
  } else if (isOppositeZone) {
    currentImageSrc = product.image;
    transformMirror = true; // Mirror to show the other temple in 360 rotation
  }

  // Calculate subtle 3D horizontal perspective rotation angle (-28° to +28°)
  // This creates physical depth without awkward distortion
  const perspectiveDeg = Math.sin((normalizedAngle * Math.PI) / 180) * 18;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onPointerUp={handlePointerUp}
    >
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {product.brand}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#000042] text-white">
                360° Studio Turntable
              </span>
            </div>
            <h3 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
              {product.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 360 Interactive Viewport */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full h-[380px] sm:h-[440px] bg-white flex items-center justify-center select-none cursor-grab active:cursor-grabbing overflow-hidden"
        >
          {/* Angle Degree Indicator */}
          <div className="absolute top-4 left-6 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-xs font-semibold text-slate-800 border border-slate-200 shadow-sm z-20">
            <Compass className="w-3.5 h-3.5 text-[#000042]" />
            <span>
              Angle: <strong className="text-[#00bac6]">{Math.round(normalizedAngle)}°</strong>
            </span>
          </div>

          {/* Prominent, Clean Eyewear Display (100% visible, fully centered, no clipping!) */}
          <div
            className="relative flex items-center justify-center transition-transform duration-75 ease-out"
            style={{
              transform: `scale(${zoomLevel}) perspective(1000px) rotateY(${perspectiveDeg}deg)`,
              maxWidth: '88%',
              maxHeight: '82%'
            }}
          >
            <img
              src={currentImageSrc}
              alt={product.name}
              draggable={false}
              className={`w-full h-auto max-h-[320px] sm:max-h-[360px] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.06)] transition-all duration-150 ${
                transformMirror ? 'scale-x-[-1]' : ''
              }`}
            />
          </div>

          {/* Interactive Hint Indicator */}
          {!isDragging && isAutoRotating && (
            <div className="absolute top-4 right-6 pointer-events-none flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50/90 text-[11px] font-semibold text-slate-500 border border-slate-200 shadow-sm">
              <RotateCw className="w-3 h-3 text-[#00bac6] animate-spin" style={{ animationDuration: '4s' }} />
              <span>Drag to spin 360°</span>
            </div>
          )}

          {/* Quick Angle Presets */}
          <div className="flex items-center gap-2 absolute bottom-4 left-6 z-20">
            <button
              onClick={() => {
                setAngle(0);
                setIsAutoRotating(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm transition-all hover:scale-105 ${
                Math.round(normalizedAngle) === 0
                  ? 'bg-[#000042] text-white border-[#000042]'
                  : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              Front (0°)
            </button>
            <button
              onClick={() => {
                setAngle(45);
                setIsAutoRotating(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm transition-all hover:scale-105 ${
                Math.round(normalizedAngle) === 45
                  ? 'bg-[#000042] text-white border-[#000042]'
                  : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              3/4 Studio (45°)
            </button>
            <button
              onClick={() => {
                setAngle(315);
                setIsAutoRotating(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm transition-all hover:scale-105 ${
                Math.round(normalizedAngle) === 315
                  ? 'bg-[#000042] text-white border-[#000042]'
                  : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              Opposite 3/4
            </button>
          </div>

          {/* Quick Zoom & Auto-Spin Action Bar */}
          <div className="flex items-center gap-1.5 absolute bottom-4 right-6 z-20">
            <button
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              title={isAutoRotating ? 'Pause Spin' : 'Auto Spin 360°'}
              className={`p-2 rounded-lg text-xs font-semibold border shadow-sm transition-all ${
                isAutoRotating
                  ? 'bg-[#00bac6]/10 text-[#00bac6] border-[#00bac6]/30'
                  : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleZoom('in')}
              title="Zoom In"
              className="p-2 rounded-lg bg-white/95 hover:bg-white text-slate-700 border border-slate-200 shadow-sm transition-all"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom('out')}
              title="Zoom Out"
              className="p-2 rounded-lg bg-white/95 hover:bg-white text-slate-700 border border-slate-200 shadow-sm transition-all"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 360 Horizontal Scrubbing Slider Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">360° Scrub:</span>
          <input
            type="range"
            min="0"
            max="360"
            value={Math.round(normalizedAngle)}
            onChange={(e) => {
              setIsAutoRotating(false);
              setAngle(parseFloat(e.target.value));
            }}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#000042]"
          />
          <span className="text-[11px] font-bold text-slate-700 w-10 text-right">{Math.round(normalizedAngle)}°</span>
        </div>

        {/* Footer Details & Action */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Dimensions</div>
              <div className="text-xs font-bold text-slate-800">
                {product.dimensions.lensWidth}-{product.dimensions.bridgeWidth}-{product.dimensions.templeLength} mm • Size {product.size}
              </div>
            </div>

            {/* Available Colors Swatches in 360 viewer */}
            {product.availableColors && product.availableColors.length > 1 && (
              <div className="border-l border-slate-200 pl-4 flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Colors:</span>
                {product.availableColors.map((color) => {
                  const isSelected = activeColor?.id === color.id;
                  return (
                    <button
                      key={color.id}
                      onClick={() => setActiveColor(color)}
                      title={color.name}
                      className={`w-5 h-5 rounded-full border transition-all ${
                        isSelected
                          ? 'ring-2 ring-[#00bac6] ring-offset-1 scale-110'
                          : 'border-slate-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                if (onTryOn) onTryOn(product);
              }}
              className="px-6 py-2.5 rounded-full bg-[#000042] text-white font-semibold text-xs tracking-wider uppercase hover:bg-[#000028] shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#00bac6]" />
              <span>Try on in AR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
