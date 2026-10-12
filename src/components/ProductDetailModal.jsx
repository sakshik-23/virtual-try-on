import React, { useState } from 'react';
import { X, Heart, ShieldCheck, RefreshCw, Sparkles, RotateCw, Check } from 'lucide-react';

export function ProductDetailModal({
  isOpen,
  onClose,
  product,
  onOpen360,
  onOpenLiveTryOn,
  onAddToCart,
  userSelfie = null,
  faceMetrics = null
}) {
  if (!isOpen || !product) return null;

  const [selectedColor, setSelectedColor] = useState(
    product.availableColors?.find(c => c.id === product.defaultColor) || product.availableColors?.[0]
  );
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Exact 3D Facial Measurement Fitting
  const posX = faceMetrics?.noseBridge?.x ? faceMetrics.noseBridge.x * 100 : 49.5;
  const posY = faceMetrics?.noseBridge?.y ? faceMetrics.noseBridge.y * 100 : 53.5;
  const tilt = faceMetrics?.tiltDeg || 0;
  const baseFaceWidth = faceMetrics?.faceSpanX ? faceMetrics.faceSpanX * 100 * 0.95 : 37.5;
  const frameMm = product.dimensions?.frameWidth || 138;
  const finalWidth = baseFaceWidth * (frameMm / 138);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Product Image Display with Try On & 360° Buttons (Matching Screenshot 1) */}
        <div className="w-full md:w-1/2 bg-[#f9fafb] p-8 flex flex-col items-center justify-center relative min-h-[320px] md:min-h-[460px]">
          {/* Main Visual: Glasses Preview or User Selfie Tryon */}
          <div className="w-full max-w-sm flex items-center justify-center my-auto">
            {userSelfie ? (
              <div className="relative w-72 h-72 rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-900">
                <img src={userSelfie} alt="Your Try-on" className="w-full h-full object-cover" />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${posX}%`,
                    top: `${posY}%`,
                    width: `${finalWidth}%`,
                    transform: `translate(-50%, -50%) rotate(${tilt}deg)`
                  }}
                >
                  <img
                    src={product.frontImage || product.image}
                    alt={product.name}
                    className="w-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                  />
                </div>
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-bold border border-white/10 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Your 3D Fit</span>
                </div>
              </div>
            ) : (
              <div className="relative w-full p-4 flex flex-col items-center justify-center">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full max-h-72 object-contain drop-shadow-md transition-transform hover:scale-105 duration-300"
                />
              </div>
            )}
          </div>

          {/* Bottom Left Floating Action Buttons: [ Try on ] and [ 360° ] (Exact match to Screenshot 1!) */}
          <div className="absolute bottom-6 left-6 flex items-center gap-2">
            <button
              onClick={() => onOpenLiveTryOn(product)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-900 text-slate-900 rounded-none text-xs font-bold hover:bg-slate-900 hover:text-white transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Try on</span>
            </button>

            <button
              onClick={() => onOpen360(product, selectedColor)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-900 text-slate-900 rounded-none text-xs font-bold hover:bg-slate-900 hover:text-white transition-all shadow-sm"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>360°</span>
            </button>
          </div>
        </div>

        {/* Right Side: Product Details & Select Lenses (Matching Screenshot 1) */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            {/* Title & Wishlist */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 leading-tight">
                  {product.name}
                </h2>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mt-1">
                  {product.brand} • {product.shape} Edit
                </p>
              </div>

              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            {/* Pricing Section (Matching Screenshot 1) */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">₹{product.price}</span>
                <span className="text-sm text-slate-400 line-through">₹{product.originalPrice}</span>
              </div>
              <p className="text-xs font-bold text-[#4f46e5] uppercase tracking-wider">
                WITH FREE BLU LENSES
              </p>
            </div>

            {/* Color Swatches */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">
                Color: <strong className="text-slate-900">{selectedColor?.name}</strong>
              </div>
              <div className="flex items-center gap-3">
                {product.availableColors?.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                      selectedColor?.id === c.id ? 'border-slate-900 scale-110 shadow-sm' : 'border-transparent'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-black/10"
                      style={{ backgroundColor: c.hex }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Warranty & Returns Badges (Matching Screenshot 1) */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
              <div className="space-y-1">
                <RefreshCw className="w-4 h-4 mx-auto text-slate-600" />
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">14 Days Exchange</p>
              </div>
              <div className="space-y-1">
                <ShieldCheck className="w-4 h-4 mx-auto text-slate-600" />
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Easy Returns</p>
              </div>
              <div className="space-y-1">
                <Check className="w-4 h-4 mx-auto text-slate-600" />
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">365 Days Warranty</p>
              </div>
            </div>
          </div>

          {/* Primary CTA Button: SELECT LENSES (Matching Screenshot 1) */}
          <div className="pt-6">
            <button
              onClick={() => onAddToCart(product)}
              className="w-full py-4 bg-[#000042] hover:bg-[#000028] text-white text-xs font-extrabold uppercase tracking-widest shadow-md transition-all active:scale-[0.99]"
            >
              SELECT LENSES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
