import React, { useState } from 'react';
import { X, Download, Trash2, ShoppingBag, Eye, Camera, Check } from 'lucide-react';

export function LookComparisonModal({
  isOpen,
  onClose,
  snapshots = [],
  onDeleteSnapshot,
  onSelectProductForTryOn,
  onAddToCart
}) {
  if (!isOpen) return null;

  const [compareLeftIndex, setCompareLeftIndex] = useState(0);
  const [compareRightIndex, setCompareRightIndex] = useState(snapshots.length > 1 ? 1 : 0);

  const handleDownload = (dataUrl, filename) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename || `lenskart-tryon-${Date.now()}.jpg`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] glass-panel rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">Side-by-Side Look Comparison</h3>
              <p className="text-xs text-slate-400">
                Compare your saved try-on photos to pick your favorite eyewear style.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {snapshots.length === 0 ? (
            <div className="py-16 text-center">
              <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-300">No Looks Captured Yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
                Click the "Capture Look" camera button while trying on glasses to save snapshots and compare them.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#00bac6] text-[#000042] font-bold text-xs hover:opacity-90 transition-all"
              >
                Back to Try-On
              </button>
            </div>
          ) : (
            <>
              {/* Dual Comparison Screen */}
              {snapshots.length >= 2 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Look Option 1</span>
                      <select
                        value={compareLeftIndex}
                        onChange={(e) => setCompareLeftIndex(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2 py-1"
                      >
                        {snapshots.map((s, idx) => (
                          <option key={s.id} value={idx}>
                            Photo #{idx + 1} - {s.product?.name} ({s.timestamp})
                          </option>
                        ))}
                      </select>
                    </div>
                    {snapshots[compareLeftIndex] && (
                      <LookCard
                        snapshot={snapshots[compareLeftIndex]}
                        onDownload={handleDownload}
                        onDelete={onDeleteSnapshot}
                        onTryOn={onSelectProductForTryOn}
                        onAddToCart={onAddToCart}
                      />
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Look Option 2</span>
                      <select
                        value={compareRightIndex}
                        onChange={(e) => setCompareRightIndex(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2 py-1"
                      >
                        {snapshots.map((s, idx) => (
                          <option key={s.id} value={idx}>
                            Photo #{idx + 1} - {s.product?.name} ({s.timestamp})
                          </option>
                        ))}
                      </select>
                    </div>
                    {snapshots[compareRightIndex] && (
                      <LookCard
                        snapshot={snapshots[compareRightIndex]}
                        onDownload={handleDownload}
                        onDelete={onDeleteSnapshot}
                        onTryOn={onSelectProductForTryOn}
                        onAddToCart={onAddToCart}
                      />
                    )}
                  </div>
                </div>
              ) : (
                /* Single Snapshot Card */
                <div className="max-w-md mx-auto">
                  <div className="text-center mb-3 text-xs text-slate-400">
                    Capture at least 1 more look to see side-by-side comparison!
                  </div>
                  <LookCard
                    snapshot={snapshots[0]}
                    onDownload={handleDownload}
                    onDelete={onDeleteSnapshot}
                    onTryOn={onSelectProductForTryOn}
                    onAddToCart={onAddToCart}
                  />
                </div>
              )}

              {/* Gallery Strip of All Photos */}
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  All Captured Photos ({snapshots.length})
                </h4>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {snapshots.map((snap, i) => (
                    <div
                      key={snap.id}
                      className="relative w-28 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-800 hover:border-cyan-400 transition-all group"
                    >
                      <img src={snap.dataUrl} alt="Tryon look" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                        <button
                          onClick={() => handleDownload(snap.dataUrl, `tryon-${i + 1}.jpg`)}
                          className="p-1 rounded bg-slate-800 text-white hover:text-cyan-400"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteSnapshot(snap.id)}
                          className="p-1 rounded bg-slate-800 text-white hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LookCard({ snapshot, onDownload, onDelete, onTryOn, onAddToCart }) {
  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3 space-y-3">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black">
        <img src={snapshot.dataUrl} alt="Look" className="w-full h-full object-cover" />
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] text-slate-300 font-mono">
          {snapshot.timestamp}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white">{snapshot.product?.name}</h4>
          <p className="text-[11px] text-slate-400">
            Color: <span className="text-slate-200">{snapshot.color?.name}</span> • Tint: <span className="text-slate-200">{snapshot.lens?.name}</span>
          </p>
          <div className="text-xs font-bold text-cyan-400 mt-0.5">₹{snapshot.product?.price}</div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onDownload(snapshot.dataUrl, `${snapshot.product?.name}.jpg`)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            title="Download Image"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onAddToCart(snapshot.product)}
            className="p-2 rounded-xl bg-[#00bac6] text-[#000042] font-bold hover:opacity-90 transition-all"
            title="Add to Cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
