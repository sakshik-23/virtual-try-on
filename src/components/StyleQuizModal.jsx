import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, X, RefreshCw } from 'lucide-react';
import { EYEWEAR_CATALOG } from '../services/catalogData';

export function StyleQuizModal({ isOpen, onClose, onSelectProduct, onTryOn }) {
  if (!isOpen) return null;

  const [step, setStep] = useState(1);
  const [selectedVibe, setSelectedVibe] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [matchedProducts, setMatchedProducts] = useState([]);

  const handleFinish = (priority) => {
    setSelectedPriority(priority);

    // AI recommendation heuristic matching vibe and outfit
    let matches = [...EYEWEAR_CATALOG];
    if (selectedVibe === 'professional') {
      matches = matches.filter(p => p.shape === 'rectangle' || p.shape === 'wayfarer');
    } else if (selectedVibe === 'trendy') {
      matches = matches.filter(p => p.shape === 'cat-eye' || p.shape === 'wayfarer');
    } else if (selectedVibe === 'minimalist') {
      matches = matches.filter(p => p.shape === 'round' || p.brand.includes('Air'));
    }

    if (matches.length === 0) matches = EYEWEAR_CATALOG.slice(0, 3);
    setMatchedProducts(matches);
    setStep(4); // Results step
  };

  const handleReset = () => {
    setStep(1);
    setSelectedVibe(null);
    setSelectedOutfit(null);
    setSelectedPriority(null);
    setMatchedProducts([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          <span className="w-6 h-6 rounded-full bg-[#000042] text-white text-[11px] font-bold flex items-center justify-center">
            {step}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {step === 4 ? 'Your Curated Matches' : `AI Style & Outfit Matcher (${step}/3)`}
          </span>
        </div>

        {/* Step 1: Personal Vibe */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-serif font-bold text-slate-900 leading-tight">
                What is your everyday aesthetic vibe?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tell us how you like to present yourself, and our AI stylist will narrow down your frame silhouettes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                { id: 'professional', title: 'Executive & Sleek', desc: 'Sharp, tailored, boardroom-ready' },
                { id: 'trendy', title: 'Bold & Fashion-Forward', desc: 'Statement silhouettes, high cheekbone lift' },
                { id: 'minimalist', title: 'Featherlight Minimal', desc: 'Barely-there rimless, pure titanium comfort' },
                { id: 'classic', title: 'Timeless Heritage', desc: 'Vintage Wayfarer & pilot aviator styling' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSelectedVibe(opt.id);
                    setStep(2);
                  }}
                  className="p-4 rounded-2xl border border-slate-200 text-left hover:border-[#000042] hover:bg-slate-50 transition-all group"
                >
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-[#000042]">{opt.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Outfit Choice */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-serif font-bold text-slate-900 leading-tight">
                What outfit do you wear most often?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Matches frame materials (acetate vs titanium) to complement your daily wardrobe.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                { id: 'formal', title: 'Formal Shirts & Blazers', desc: 'Pairs best with refined thin titanium or matte black' },
                { id: 'casual', title: 'Casual Tees & Denims', desc: 'Complements bold acetate Wayfarers and rounds' },
                { id: 'ethnic', title: 'Traditional & Festive', desc: 'Elevated with Champagne Gold and Rose Gold metal' },
                { id: 'athleisure', title: 'Streetwear & Athleisure', desc: 'Modern geometric hexagons and pilot frames' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSelectedOutfit(opt.id);
                    setStep(3);
                  }}
                  className="p-4 rounded-2xl border border-slate-200 text-left hover:border-[#000042] hover:bg-slate-50 transition-all group"
                >
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-[#000042]">{opt.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Priority */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-serif font-bold text-slate-900 leading-tight">
                What matters most in your glasses?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Final touch to personalize frame weight and optical blue-light coating.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                { id: 'weight', title: 'Zero Weight / No Pressure', desc: 'Ultra-light memory metal with soft silicone pads' },
                { id: 'look', title: 'Make a Style Statement', desc: 'Bold defined profile that stands out on camera' },
                { id: 'screen', title: 'Digital Screen Protection', desc: 'Pre-fitted with certified 98% Blue-Cut lenses' },
                { id: 'durability', title: 'Maximum Durability', desc: 'Flexible spring hinges and drop-tested rims' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleFinish(opt.id)}
                  className="p-4 rounded-2xl border border-slate-200 text-left hover:border-[#000042] hover:bg-slate-50 transition-all group"
                >
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-[#000042]">{opt.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Matched Recommendations */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-serif font-bold text-slate-900 leading-tight">
                  Your AI Recommended Frames
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Curated for your {selectedVibe} aesthetic and {selectedOutfit} wardrobe.
                </p>
              </div>

              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake Quiz</span>
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {matchedProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#000042] bg-blue-100/60 px-2 py-0.5 rounded">
                      98% Match Score
                    </span>
                    <h4 className="font-serif font-bold text-slate-900 text-base mt-1">{p.name}</h4>
                    <p className="text-xs text-slate-500">
                      ₹{p.price} • Shape: <span className="capitalize">{p.shape}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onClose();
                        if (onTryOn) onTryOn(p);
                      }}
                      className="px-4 py-2 bg-[#000042] text-white text-xs font-bold rounded-full hover:bg-[#000028] transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#00bac6]" />
                      <span>Try on</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
