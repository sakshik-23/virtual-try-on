import React from 'react';
import {
  X,
  User,
  Camera,
  Trash2,
  Sparkles,
  ShieldCheck,
  Glasses,
  Heart,
  ShoppingBag,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

export function UserProfileModal({
  isOpen,
  onClose,
  userSelfie = null,
  faceMetrics = null,
  onOpenTryOn,
  onClearFaceData,
  wishlistCount = 0,
  cartCount = 0
}) {
  if (!isOpen) return null;

  const pdMm = faceMetrics?.measuredPdMm || 63.5;
  const faceWidthMm = faceMetrics?.measuredFaceWidthMm || 138;
  const recommendedSize = faceMetrics?.recommendedSize || 'Medium';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#000042] text-white flex items-center justify-center font-bold text-lg shadow-md">
              SK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-bold text-slate-900">
                  Sakshi Kokare
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Gold Member
                </span>
              </div>
              <p className="text-xs text-slate-400">
                sakshi.kokare@spectraoptics.com
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Saved Frames
              </span>
              <span className="text-lg font-extrabold text-slate-900 flex items-center justify-center gap-1 mt-0.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                {wishlistCount}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                In Cart
              </span>
              <span className="text-lg font-extrabold text-slate-900 flex items-center justify-center gap-1 mt-0.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#000042]" />
                {cartCount}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Prescription
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1 mt-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Active
              </span>
            </div>
          </div>

          {/* 3D Face Profile & Optometric Biometrics Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-white to-slate-50 border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#000042]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Personal 3D Face Profile
                </h3>
              </div>
              {userSelfie && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Calibrated
                </span>
              )}
            </div>

            {userSelfie ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* 3D Selfie Thumbnail */}
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#000042] shadow-md shrink-0">
                  <img
                    src={userSelfie}
                    alt="3D Avatar"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center p-1">
                    <span className="text-[9px] font-bold text-white uppercase">3D Avatar</span>
                  </div>
                </div>

                {/* Biometric Measurements */}
                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="text-slate-500">Pupillary Distance (PD):</span>
                    <span className="font-bold text-slate-900">{pdMm} mm</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="text-slate-500">Facial Width:</span>
                    <span className="font-bold text-slate-900">{faceWidthMm} mm</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="text-slate-500">Recommended Size:</span>
                    <span className="font-bold text-[#000042]">{recommendedSize} Fit</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenTryOn) onOpenTryOn();
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#000042] text-white text-[11px] font-bold hover:bg-[#000028] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Retake 3D Scan</span>
                    </button>

                    <button
                      onClick={onClearFaceData}
                      className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear Scan</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Take a 3-second 3D photo to unlock your pupillary distance (PD), facial geometry, and auto-scaled live try-on!
                </p>
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenTryOn) onOpenTryOn();
                  }}
                  className="px-5 py-2 rounded-full bg-[#000042] text-white text-xs font-bold hover:bg-[#000028] transition-all flex items-center gap-1.5 mx-auto shadow-md cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Start 3D Face Scan</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Prescription Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Lens Prescription Profile
              </span>
              <span className="text-[11px] text-[#000042] font-semibold">
                Single Vision Standard
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">R (SPH)</span>
                <span className="font-bold text-slate-800">-0.75</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">R (CYL)</span>
                <span className="font-bold text-slate-800">-0.25</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">L (SPH)</span>
                <span className="font-bold text-slate-800">-0.50</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">L (CYL)</span>
                <span className="font-bold text-slate-800">0.00</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Blue Light Filter & Anti-Reflective Coating Included</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
