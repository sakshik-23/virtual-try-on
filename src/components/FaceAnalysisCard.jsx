import React from 'react';
import { Sparkles, Ruler, CheckCircle, Info, ChevronRight, Eye } from 'lucide-react';
import { FACE_SHAPES_INFO } from '../services/catalogData';

export function FaceAnalysisCard({ faceData, onSelectRecommendedShape }) {
  if (!faceData || !faceData.shapeInfo) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 shadow-xl flex flex-col items-center justify-center text-center min-h-[220px]">
        <div className="w-12 h-12 rounded-2xl bg-cyan-950/40 border border-cyan-800/50 flex items-center justify-center mb-3">
          <Sparkles className="w-6 h-6 text-[#00bac6] animate-pulse" />
        </div>
        <h3 className="font-bold text-white text-base mb-1">AI Face Stylist & Biometrics</h3>
        <p className="text-xs text-slate-400 max-w-xs">
          Look straight into the camera to measure your Pupillary Distance (PD) and detect your face shape.
        </p>
      </div>
    );
  }

  const { shapeInfo, metrics } = faceData;
  const currentShape = shapeInfo.shape || 'Oval';
  const shapeDetails = FACE_SHAPES_INFO[currentShape] || FACE_SHAPES_INFO.Oval;
  const pdMm = metrics?.measuredPdMm || 63.0;
  const faceWidthMm = metrics?.measuredFaceWidthMm || 138;
  const recommendedSize = metrics?.recommendedSize || 'Medium';

  return (
    <div className="glass-panel-accent rounded-2xl p-5 border border-cyan-500/30 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#00bac6]/20 border border-[#00bac6]/40">
            <Sparkles className="w-4 h-4 text-[#00bac6]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">AI Face Biometrics</h3>
            <p className="text-[11px] text-slate-400">Real-time landmark geometric analysis</p>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active Scan
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Face Shape */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Face Shape</span>
          <div className="my-1">
            <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-white">
              {currentShape}
            </span>
          </div>
          <span className="text-[10px] text-cyan-400/90 font-medium">
            {Math.round((shapeInfo.confidence || 0.9) * 100)}% match confidence
          </span>
        </div>

        {/* Pupillary Distance (PD) */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Pupil Dist (PD)</span>
            <Ruler className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="my-1 flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-white">{pdMm}</span>
            <span className="text-xs text-slate-400 font-semibold">mm</span>
          </div>
          <span className="text-[10px] text-slate-400">
            Fit: <strong className="text-slate-200">{recommendedSize}</strong> ({faceWidthMm}mm width)
          </span>
        </div>
      </div>

      {/* PD Ruler Gauge */}
      <div className="px-3 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-slate-400 flex items-center gap-1">
            <Eye className="w-3 h-3 text-[#00bac6]" /> Pupillary Alignment Gauge
          </span>
          <span className="text-cyan-300 font-mono font-bold">{pdMm} mm</span>
        </div>
        <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          {/* Normal range is 54mm to 72mm. Map 54-72 to 0-100% */}
          <div
            className="absolute top-0 bottom-0 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(Math.max(((pdMm - 54) / 18) * 100, 10), 100)}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
          <span>56mm (Narrow)</span>
          <span>63mm (Standard)</span>
          <span>72mm (Wide)</span>
        </div>
      </div>

      {/* Stylist Recommendation Summary */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/70 text-xs">
        <p className="text-slate-300 mb-2 leading-relaxed">
          <strong className="text-white">{shapeDetails.title}:</strong> {shapeDetails.description}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mr-1">
            Best Frames:
          </span>
          {shapeDetails.recommendedFrames.map((frameName) => (
            <span
              key={frameName}
              className="px-2 py-0.5 rounded-md bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 text-[10px] font-semibold"
            >
              {frameName}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
