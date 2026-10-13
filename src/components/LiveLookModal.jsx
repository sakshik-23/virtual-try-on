import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, RotateCw, ShoppingBag, Sparkles, Check, SlidersHorizontal, Camera } from 'lucide-react';
import { EYEWEAR_CATALOG } from '../services/catalogData';

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

  // Touch Swipe Handling (Swipe left/right to change specs dynamically!)
  const touchStartXRef = useRef(null);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext(); // Swiped left -> Next specs
      else handlePrev(); // Swiped right -> Prev specs
    }
    touchStartXRef.current = null;
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

  // Precise Optometric Fitting Style
  const getFittingStyle = (product) => {
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

  const activeCutoutImage = activeProduct.frontImage || activeProduct.image;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[95vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#000042] text-white">
              Dynamic Live Try-On
            </span>
            <span className="text-xs text-slate-400">
              Frame {currentIndex + 1} of {productList.length}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Live Try-On"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Stage: Face Avatar with Dynamically Swapped Eyewear */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative flex-1 bg-slate-900 min-h-[380px] sm:min-h-[460px] flex items-center justify-center overflow-hidden select-none"
        >
          
          {userSelfie ? (
            <div className="relative w-full h-full max-w-lg aspect-square flex items-center justify-center">
              <img
                src={userSelfie}
                alt="Your 3D Avatar"
                className="w-full h-full object-cover rounded-2xl"
              />
              
              {/* Dynamic Spectacles Cutout Overlay */}
              <div
                className="absolute pointer-events-none transition-all duration-200"
                style={getFittingStyle(activeProduct)}
              >
                <img
                  src={activeCutoutImage}
                  alt={activeProduct.name}
                  className="w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)] transition-transform duration-200 animate-in fade-in zoom-in-95"
                />
              </div>

              {/* Status Badge */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-2 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live 3D Superimposition</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-white space-y-4 max-w-md">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-[#00bac6]" />
              </div>
              <h4 className="text-xl font-serif font-bold">No 3D Face Photo Yet</h4>
              <p className="text-xs text-slate-300">
                Take a quick photo with your camera to see these spectacles live on your face!
              </p>
              <div className="w-64 mx-auto p-4 bg-white/5 rounded-2xl border border-white/10">
                <img
                  src={activeCutoutImage}
                  alt={activeProduct.name}
                  className="w-full object-contain max-h-28 mx-auto drop-shadow-md"
                />
              </div>
              <button
                onClick={() => {
                  onClose();
                  navigate('/try-on');
                }}
                className="mt-2 px-6 py-2.5 rounded-full bg-[#00bac6] hover:bg-[#00a1ad] active:scale-95 text-[#000042] font-bold text-xs transition-all flex items-center justify-center gap-2 mx-auto shadow-md"
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo for 3D Try-On</span>
              </button>
            </div>
          )}

          {/* Left Arrow: Previous Specs */}
          <button
            onClick={handlePrev}
            aria-label="Previous Spectacles"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 hover:scale-105 shadow-xl z-20"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow: Next Specs */}
          <button
            onClick={handleNext}
            aria-label="Next Spectacles"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 hover:scale-105 shadow-xl z-20"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Bottom Floating Info Pill */}
          <div className="absolute bottom-4 inset-x-4 max-w-md mx-auto bg-black/75 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 text-white flex items-center justify-between shadow-2xl z-20">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#00bac6]">
                {activeProduct.brand} • {activeProduct.size} Fit ({activeProduct.dimensions?.frameWidth || 138}mm)
              </div>
              <div className="text-sm font-serif font-bold truncate max-w-[200px]">
                {activeProduct.name}
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-white">
                ₹{activeProduct.price}
              </span>
              <span className="text-[11px] text-slate-400 line-through ml-1.5">
                ₹{activeProduct.originalPrice}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Control Dock: Frame Carousel & Actions */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Thumbnail Carousel of All Glasses (Click any to try dynamically!) */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 scrollbar-none">
            {productList.map((product, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={product.id || product.sku}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative shrink-0 w-16 h-14 rounded-xl border p-1 transition-all flex flex-col items-center justify-center bg-[#f9fafb] ${
                    isSelected
                      ? 'border-[#000042] ring-2 ring-[#000042]/20 shadow-md bg-blue-50/40 scale-105'
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
          <div className="flex items-center gap-3 shrink-0">
            {onOpen360 && (
              <button
                onClick={() => {
                  onClose();
                  onOpen360(activeProduct, selectedColor);
                }}
                className="px-4 py-2.5 rounded-full border border-slate-900 text-slate-900 text-xs font-bold hover:bg-slate-900 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>360° View</span>
              </button>
            )}

            <button
              onClick={() => {
                if (onAddToCart) onAddToCart(activeProduct);
              }}
              className="px-5 py-2.5 rounded-full bg-[#000042] text-white text-xs font-bold hover:bg-[#000028] transition-all flex items-center gap-1.5 shadow-md uppercase tracking-wider"
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
