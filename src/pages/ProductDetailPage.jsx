import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, ShieldCheck, RefreshCw, Sparkles, RotateCw, Check, ArrowLeft } from 'lucide-react';
import { EYEWEAR_CATALOG } from '../services/catalogData';

export function ProductDetailPage({
  onOpen360,
  onOpenLiveTryOn,
  onAddToCart,
  userSelfie = null,
  faceMetrics = null
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const product = EYEWEAR_CATALOG.find((p) => p.id === id) || EYEWEAR_CATALOG[0];

  const [selectedColor, setSelectedColor] = useState(
    product.availableColors?.find((c) => c.id === product.defaultColor) || product.availableColors?.[0]
  );
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Exact 3D Facial Measurement Fitting based on Eye Distance (IPD)
  const posX = faceMetrics?.noseBridge?.x != null ? faceMetrics.noseBridge.x * 100 : 50.0;
  const posY = faceMetrics?.noseBridge?.y != null ? faceMetrics.noseBridge.y * 100 : 51.5;
  const tilt = faceMetrics?.tiltDeg || 0;
  const frameMm = product.dimensions?.frameWidth || 138;
  const finalWidth = faceMetrics?.ipdRatio
    ? faceMetrics.ipdRatio * (frameMm / 63.0) * 100
    : faceMetrics?.faceSpanRatio
    ? faceMetrics.faceSpanRatio * (frameMm / 138.0) * 100
    : 48.0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Frames</span>
      </button>

      {/* Main Product Container (Matching Screenshot 1) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Product Image Display with Try On & 360° Buttons */}
        <div className="w-full md:w-1/2 bg-[#f9fafb] p-8 sm:p-12 flex flex-col items-center justify-center relative min-h-[380px] md:min-h-[500px]">
          {/* Main Visual */}
          <div className="w-full max-w-md flex items-center justify-center my-auto">
            {userSelfie ? (
              <div className="relative w-80 h-80 rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-900">
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
                  className="w-full max-h-80 object-contain drop-shadow-md transition-transform hover:scale-105 duration-300"
                />
              </div>
            )}
          </div>

          {/* Bottom Left Floating Action Buttons: [ Try on ] and [ 360° ] (Exact match to Screenshot 1) */}
          <div className="absolute bottom-6 left-6 flex items-center gap-2">
            <button
              onClick={() => onOpenLiveTryOn(product)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-900 text-slate-900 text-xs font-bold hover:bg-slate-900 hover:text-white transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-[#00bac6]" />
              <span>Try on</span>
            </button>

            <button
              onClick={() => onOpen360(product, selectedColor)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-900 text-slate-900 text-xs font-bold hover:bg-slate-900 hover:text-white transition-all shadow-sm"
            >
              <RotateCw className="w-4 h-4" />
              <span>360°</span>
            </button>
          </div>
        </div>

        {/* Right Side: Product Details & SELECT LENSES */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 leading-tight">
                  {product.name}
                </h1>
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

            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">₹{product.price}</span>
                <span className="text-sm text-slate-400 line-through">₹{product.originalPrice}</span>
              </div>
              <p className="text-xs font-bold text-[#4f46e5] uppercase tracking-wider">
                WITH FREE BLU LENSES
              </p>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">
                Color: <strong className="text-slate-900">{selectedColor?.name}</strong>
              </div>
              <div className="flex items-center gap-3">
                {product.availableColors?.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                      selectedColor?.id === c.id ? 'border-slate-900 scale-110 shadow-sm' : 'border-transparent'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-black/10"
                      style={{ backgroundColor: c.hex }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Physical Dimensions in mm */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-slate-700 mb-1">Specifications:</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>Lens Width: <strong>{product.dimensions.lensWidth} mm</strong></div>
                <div>Bridge Width: <strong>{product.dimensions.bridgeWidth} mm</strong></div>
                <div>Temple Length: <strong>{product.dimensions.templeLength} mm</strong></div>
                <div>Frame Width: <strong>{product.dimensions.frameWidth} mm</strong></div>
              </div>
            </div>

            {/* Warranty & Badges */}
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

          {/* Action Button */}
          <div className="pt-8">
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
