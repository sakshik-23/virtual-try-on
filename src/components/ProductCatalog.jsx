import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, Sparkles, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { EYEWEAR_CATALOG } from '../services/catalogData';

export function ProductCatalog({
  category = 'eyeglasses',
  onSelectProduct,
  onOpen360,
  onOpenLiveTryOn,
  onAddToCart,
  userSelfie = null,
  faceMetrics = null,
  is3DTryOnActive = true,
  onToggle3DTryOn
}) {
  const navigate = useNavigate();
  const [selectedShape, setSelectedShape] = useState('all');

  // Interactive Fit Calibration State (Persisted in localStorage)
  const [fitCalibration, setFitCalibration] = useState(() => {
    try {
      const saved = localStorage.getItem('spectra_fit_calibration');
      return saved ? JSON.parse(saved) : { offsetY: 0, scaleMultiplier: 1.0 };
    } catch {
      return { offsetY: 0, scaleMultiplier: 1.0 };
    }
  });
  const [showCalibrator, setShowCalibrator] = useState(false);

  const updateFitCalibration = (updates) => {
    setFitCalibration((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('spectra_fit_calibration', JSON.stringify(next));
      } catch (e) {
        console.warn('Storage error', e);
      }
      return next;
    });
  };

  // Precise Face Geometry Fitting Calculation
  const getGlassesFittingStyle = (product) => {
    // 1. Center coordinates
    const posX = faceMetrics?.noseBridge?.x ? faceMetrics.noseBridge.x * 100 : 49.5;
    // Eye/nose bridge level is naturally at 53.5% in standard webcam portraits
    const baseY = faceMetrics?.noseBridge?.y ? faceMetrics.noseBridge.y * 100 : 53.5;
    const posY = baseY + (fitCalibration.offsetY || 0);

    // 2. Head tilt angle in degrees
    const tilt = faceMetrics?.tiltDeg || 0;

    // 3. Proportional physical width
    // Human face width spans ~37.5% of standard webcam selfie frame
    const baseFaceWidth = faceMetrics?.faceSpanX ? faceMetrics.faceSpanX * 100 * 0.95 : 37.5;

    // Scale dynamically by frame's true millimeter width (e.g., Narrow 134mm vs Wide 144mm)
    const frameMm = product.dimensions?.frameWidth || 138;
    const mmRatio = frameMm / 138;

    const finalWidth = baseFaceWidth * mmRatio * (fitCalibration.scaleMultiplier || 1.0);

    return {
      left: `${posX}%`,
      top: `${posY}%`,
      width: `${finalWidth}%`,
      transform: `translate(-50%, -50%) rotate(${tilt}deg)`
    };
  };

  const filteredProducts = EYEWEAR_CATALOG.filter((p) => {
    if (category && p.type !== category) return false;
    if (selectedShape !== 'all' && p.shape !== selectedShape) return false;
    return true;
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Breadcrumb & Controls (Matching Screenshot 5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="text-[11px] text-slate-400 mb-1">
            Eyewear / 3D Try On / <span className="text-slate-800 font-semibold capitalize">{category}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 capitalize">
              {category}
            </h1>
            <span className="text-xs text-slate-400 font-medium">
              {filteredProducts.length} Items
            </span>
          </div>
        </div>

        {/* Right Header Controls: 3D Try-on Toggle, Sort by, Filters */}
        <div className="flex items-center flex-wrap gap-4 sm:gap-6">
          {/* 3D Try-on ACTIVE Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggle3DTryOn}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                is3DTryOnActive ? 'bg-[#000042]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  is3DTryOnActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <div className="text-left">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 block">
                3D Try-on
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${is3DTryOnActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                {is3DTryOnActive ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
          </div>

          {/* Calibrate Fit Button (Only shown when user has a selfie) */}
          {userSelfie && is3DTryOnActive && (
            <button
              onClick={() => setShowCalibrator(!showCalibrator)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                showCalibrator
                  ? 'bg-[#000042] text-white border-[#000042]'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Fine-tune spectacles position on face"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Calibrate Fit</span>
            </button>
          )}

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
            <span className="text-slate-400">Sort by</span>
            <span className="font-bold uppercase tracking-wider text-slate-900">RECOMMENDED</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400">Filters</span>
            <span className="font-bold uppercase tracking-wider text-slate-900">ALL</span>
          </div>
        </div>
      </div>

      {/* Optional Interactive Fit Calibrator Drawer */}
      {showCalibrator && userSelfie && is3DTryOnActive && (
        <div className="my-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">3D Face Fit Calibrator</span>
            <span className="text-[11px] text-slate-500">Fine-tune vertical position and size to match your camera height:</span>
          </div>

          <div className="flex items-center flex-wrap gap-4 text-xs font-semibold">
            {/* Height Position */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Height:</span>
              <button
                onClick={() => updateFitCalibration({ offsetY: (fitCalibration.offsetY || 0) - 1 })}
                className="px-2 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-800"
                title="Move Up"
              >
                ▲ Up
              </button>
              <button
                onClick={() => updateFitCalibration({ offsetY: (fitCalibration.offsetY || 0) + 1 })}
                className="px-2 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-800"
                title="Move Down"
              >
                ▼ Down
              </button>
            </div>

            {/* Frame Size */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Scale:</span>
              <button
                onClick={() => updateFitCalibration({ scaleMultiplier: Math.max(0.7, (fitCalibration.scaleMultiplier || 1.0) - 0.04) })}
                className="px-2 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-800"
                title="Smaller"
              >
                − Smaller
              </button>
              <button
                onClick={() => updateFitCalibration({ scaleMultiplier: Math.min(1.4, (fitCalibration.scaleMultiplier || 1.0) + 0.04) })}
                className="px-2 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-800"
                title="Larger"
              >
                + Larger
              </button>
            </div>

            {/* Reset */}
            <button
              onClick={() => updateFitCalibration({ offsetY: 0, scaleMultiplier: 1.0 })}
              className="px-2.5 py-1 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px]"
            >
              Reset to 3D Auto-Fit
            </button>
          </div>
        </div>
      )}

      {/* Frame Shapes Filter Pills */}
      <div className="flex items-center gap-2 py-4 overflow-x-auto text-xs">
        {['all', 'wayfarer', 'round', 'cat-eye', 'rectangle'].map((shape) => (
          <button
            key={shape}
            onClick={() => setSelectedShape(shape)}
            className={`px-4 py-1.5 rounded-full capitalize font-semibold transition-all ${
              selectedShape === shape
                ? 'bg-[#000042] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {shape}
          </button>
        ))}
      </div>

      {/* Spectacles Grid (Matching Screenshot 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
        {filteredProducts.map((product) => {
          return (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-400 overflow-hidden transition-all duration-300 flex flex-col justify-between hover:shadow-lg"
            >
              {/* Product Visual Area */}
              <div className="relative aspect-square bg-[#f9fafb] overflow-hidden flex items-center justify-center">
                {/* If 3D Try-On is Active AND user has taken a selfie: display selfie with real glasses tried on! */}
                {is3DTryOnActive && userSelfie ? (
                  <div
                    className="relative w-full h-full cursor-pointer bg-slate-900"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <img
                      src={userSelfie}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Real Cutout of the exact Spectacles positioned naturally on the face */}
                    <div
                      className="absolute pointer-events-none transition-all duration-150"
                      style={getGlassesFittingStyle(product)}
                    >
                      <img
                        src={product.frontImage || product.image}
                        alt={product.name}
                        className="w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    {/* Real Try-On Live Badge */}
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Virtual Fit</span>
                    </div>
                  </div>
                ) : (
                  /* Standard Real Photorealistic Studio Image */
                  <div
                    className="w-full h-full p-4 flex items-center justify-center cursor-pointer bg-white"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain max-h-52 drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Overlay Action Buttons: [ Try on ] & [ 360° ] (Matching Screenshot 1) */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onOpenLiveTryOn(product)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-900 text-slate-900 rounded-none text-[11px] font-bold hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                  >
                    <Sparkles className="w-3 h-3 text-[#00bac6]" />
                    <span>Try on</span>
                  </button>

                  <button
                    onClick={() => onOpen360(product, product.availableColors[0])}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-900 text-slate-900 rounded-none text-[11px] font-bold hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>360°</span>
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-serif font-bold text-slate-900 text-base truncate">
                    {product.name}
                  </h3>
                </div>

                {/* Color Swatch Dots */}
                <div className="flex items-center gap-1.5 mb-2">
                  {product.availableColors.slice(0, 3).map((c) => (
                    <span
                      key={c.id}
                      className="w-4 h-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  <span className="text-[11px] text-slate-500 font-medium">
                    +{product.availableColors.length + 4}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold text-slate-900">
                    ₹{product.price}
                  </span>
                  <span className="text-xs text-slate-400 line-through">
                    ₹{product.originalPrice}
                  </span>
                </div>
              </div>

              {/* Action Button: SELECT LENSES */}
              <div className="px-4 pb-4">
                <button
                  onClick={() => onAddToCart(product)}
                  className="w-full py-2.5 bg-[#000042] hover:bg-[#000028] text-white text-[11px] font-bold uppercase tracking-wider transition-all"
                >
                  SELECT LENSES
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
