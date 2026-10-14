import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Glasses, 
  Camera, 
  Rotate3d, 
  ShoppingBag, 
  ArrowRight, 
  CheckCircle2, 
  Sliders, 
  ShieldCheck, 
  Compass,
  Eye,
  Maximize2
} from 'lucide-react';
import { HeroThreeSpectacles } from '../components/HeroThreeSpectacles';

export function HomePage({
  catalogProducts = [],
  onOpenLiveTryOn,
  onOpen360,
  onOpenStyleQuiz,
  onAddToCart
}) {
  const navigate = useNavigate();

  // Curate popular top frames for the preview section
  const previewProducts = catalogProducts.slice(0, 4);

  return (
    <div className="w-full bg-white text-slate-900 overflow-hidden">
      
      {/* ================= 1. HERO SECTION WITH THREE.JS 3D SPECTACLES ================= */}
      <section className="relative pt-6 sm:pt-10 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Hero Content: Headline & Project Intro */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-bold text-[#000042]">
              <Sparkles className="w-3.5 h-3.5 text-[#00bac6]" />
              <span>Next-Gen Virtual Optical Studio</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Experience Spectacles in <span className="text-[#000042] underline decoration-[#00bac6] decoration-4 underline-offset-6">True 3D</span> Before You Buy
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              Welcome to <strong>Spectra Optics</strong> — an AI-powered eyewear studio that turns your device into a millimeter-accurate digital mirror. Try on frames live in AR, inspect 360° 3D models with Three.js, and find your ideal fit in seconds.
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/eyeglasses"
                className="px-6 py-3 rounded-full bg-[#000042] text-white font-bold text-xs sm:text-sm hover:bg-[#000028] shadow-lg shadow-blue-950/15 transition-all flex items-center gap-2 group cursor-pointer"
              >
                <Glasses className="w-4 h-4 text-[#00bac6]" />
                <span>Explore Eyeglasses</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={() => onOpenLiveTryOn ? onOpenLiveTryOn(catalogProducts[0]) : navigate('/try-on')}
                className="px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Camera className="w-4 h-4 text-[#000042]" />
                <span>Launch Live 3D Try-On</span>
              </button>

              {onOpenStyleQuiz && (
                <button
                  onClick={onOpenStyleQuiz}
                  className="px-4 py-3 rounded-full text-slate-600 hover:text-slate-900 text-xs font-semibold hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-[#00bac6]" />
                  <span>AI Style Matcher</span>
                </button>
              )}
            </div>

            {/* Key Trust Badges */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-100 max-w-lg">
              <div>
                <span className="block text-base sm:text-lg font-bold text-slate-900 font-serif">1:1 Fit</span>
                <span className="text-[11px] text-slate-500 font-medium">Millimeter Scaling</span>
              </div>
              <div>
                <span className="block text-base sm:text-lg font-bold text-slate-900 font-serif">478 Points</span>
                <span className="text-[11px] text-slate-500 font-medium">Face Mesh Tracking</span>
              </div>
              <div>
                <span className="block text-base sm:text-lg font-bold text-slate-900 font-serif">360° WebGL</span>
                <span className="text-[11px] text-slate-500 font-medium">Interactive Three.js</span>
              </div>
            </div>
          </div>

          {/* Right Hero: Interactive 3D Spectacles Three.js Showcase */}
          <div className="lg:col-span-6 relative">
            <div className="relative w-full rounded-3xl bg-gradient-to-b from-slate-50/80 to-slate-100/60 border border-slate-200/90 shadow-xl p-4 sm:p-6 overflow-hidden">
              <HeroThreeSpectacles
                onExploreFrames={() => navigate('/eyeglasses')}
                onLaunchTryOn={() => onOpenLiveTryOn ? onOpenLiveTryOn(catalogProducts[0]) : navigate('/try-on')}
              />
            </div>
          </div>

        </div>
      </section>

      {/* ================= 2. HOW IT WORKS / STEP-BY-STEP GUIDE ================= */}
      <section className="py-16 sm:py-20 bg-slate-50/70 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00bac6] block mb-2">
              Simple 4-Step Guide
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              How Spectra Optics Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Everything you need to find and preview your ideal pair of glasses from the comfort of your home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative group hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#000042] flex items-center justify-center font-bold text-base mb-4 group-hover:scale-105 transition-transform">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                1. Browse Styles
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Explore our catalog of Wayfarers, Aviators, Minimalist Rounds, and Cat-Eye frames with tailored dimensions.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-[#000042]">
                <Glasses className="w-3.5 h-3.5 text-[#00bac6]" />
                <span>Over 12+ premium frames</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative group hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00bac6] flex items-center justify-center font-bold text-base mb-4 group-hover:scale-105 transition-transform">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                2. Live 3D AR Try-On
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Turn on your camera for instant 478-point facial landmark scanning. Watch the glasses track head movements smoothly.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-[#000042]">
                <Camera className="w-3.5 h-3.5 text-[#00bac6]" />
                <span>Real-time Pupillary Distance</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative group hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-base mb-4 group-hover:scale-105 transition-transform">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                3. Inspect in 360° 3D
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rotate spectacles in full 3D with Three.js. Inspect temple arms, nose pads, and test acetate & metal color swatches.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-[#000042]">
                <Rotate3d className="w-3.5 h-3.5 text-[#00bac6]" />
                <span>Orbital WebGL controls</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative group hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-base mb-4 group-hover:scale-105 transition-transform">
                04
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                4. Select & Order
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Save your favorites to your wishlist or add to cart. Enter your prescription and check out with guaranteed fit.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-[#000042]">
                <ShoppingBag className="w-3.5 h-3.5 text-[#00bac6]" />
                <span>Instant cart & profile</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ================= 3. FEATURED EYEWEAR SHOWCASE ================= */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#00bac6] block mb-1">
              Popular Styles
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Curated Eyewear Collection
            </h2>
          </div>
          <Link
            to="/eyeglasses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#000042] hover:text-[#00bac6] transition-colors"
          >
            <span>View All Eyeglasses ({catalogProducts.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Featured Frame Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {previewProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group"
            >
              {/* Product Image */}
              <div className="relative h-48 bg-slate-50 flex items-center justify-center p-4 overflow-hidden">
                <img
                  src={product.frontImage || product.image}
                  alt={product.name}
                  className="max-h-full max-w-[85%] object-contain group-hover:scale-105 transition-transform duration-300"
                />

                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#000042] text-white">
                  {product.shape}
                </span>

                {/* Quick 360 Overlay Button */}
                <button
                  onClick={() => onOpen360 ? onOpen360(product) : null}
                  className="absolute bottom-3 right-3 p-2 rounded-full bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-200 transition-all hover:scale-110 cursor-pointer"
                  title="Open 360° 3D Viewer"
                >
                  <Rotate3d className="w-4 h-4 text-[#000042]" />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {product.brand}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-bold text-slate-900">
                      ₹{product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-slate-400 line-through">
                        ₹{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => onOpenLiveTryOn ? onOpenLiveTryOn(product) : navigate('/try-on')}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-[#000042] hover:text-white text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#00bac6]" />
                    <span>Try On AR</span>
                  </button>

                  <button
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="p-2 rounded-xl border border-slate-200 hover:border-slate-400 text-slate-600 transition-colors cursor-pointer"
                    title="View Product Details"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= 4. PROJECT MISSION / FOOTER CTA ================= */}
      <section className="bg-[#000042] text-white py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-[#00bac6]">
            <Glasses className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
            Ready to find your signature look?
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
            Zero plugins or apps required. Simply allow your camera or browse our complete collection to experience 3D virtual try-on on any desktop or mobile device.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/eyeglasses"
              className="px-6 py-3 rounded-full bg-white text-[#000042] font-bold text-xs sm:text-sm hover:bg-slate-100 transition-all shadow-lg"
            >
              Browse Full Catalog
            </Link>

            <button
              onClick={() => onOpenLiveTryOn ? onOpenLiveTryOn(catalogProducts[0]) : navigate('/try-on')}
              className="px-6 py-3 rounded-full bg-[#00bac6] text-white font-bold text-xs sm:text-sm hover:bg-[#00a2ad] transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Launch AR Camera</span>
            </button>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#00bac6]/10 blur-3xl rounded-full pointer-events-none" />
      </section>

    </div>
  );
}
