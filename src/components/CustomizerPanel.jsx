import React from 'react';
import { Palette, SunMedium, Sliders } from 'lucide-react';

export function CustomizerPanel({
  activeProduct,
  activeColor,
  activeLens,
  onSelectColor,
  onSelectLens
}) {
  if (!activeProduct) return null;

  const colors = activeProduct.availableColors || [];
  const lenses = activeProduct.availableLensTints || [];

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#00bac6]" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Live Frame Customizer</h4>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">Instant 3D Updates</span>
      </div>

      {/* Frame Color Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-semibold text-slate-300">Frame Colorway:</label>
          <span className="text-[11px] font-mono text-cyan-400">{activeColor?.name}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {colors.map((color) => {
            const isSelected = activeColor?.id === color.id;
            return (
              <button
                key={color.id}
                onClick={() => onSelectColor(color)}
                className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all text-xs ${
                  isSelected
                    ? 'bg-slate-800 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="font-medium">{color.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lens Tint Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
            <SunMedium className="w-3.5 h-3.5 text-amber-400" /> Lens Coating & Tint:
          </label>
          <span className="text-[11px] font-mono text-amber-300">{activeLens?.name}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {lenses.map((lens) => {
            const isSelected = activeLens?.id === lens.id;
            return (
              <button
                key={lens.id}
                onClick={() => onSelectLens(lens)}
                className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-amber-400/80 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full border border-white/30 shrink-0"
                  style={{
                    backgroundColor: lens.hex,
                    opacity: Math.max(lens.opacity, 0.4)
                  }}
                />
                <div className="truncate">
                  <div className="text-[11px] font-semibold truncate leading-tight">{lens.name}</div>
                  <div className="text-[9px] text-slate-500">
                    {lens.opacity > 0.5 ? 'Sun Tint' : 'Clear Optic'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
