import React from 'react';
import { X, Heart, ShoppingBag, Trash2, Sparkles, ArrowRight } from 'lucide-react';

export function WishlistDrawer({
  isOpen,
  onClose,
  wishlistItems = [],
  onRemoveItem,
  onAddToCart,
  onTryOn
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-100 animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <Heart className="w-4 h-4 fill-rose-600" />
              </div>
              <h2 className="text-lg font-serif font-bold text-slate-900">
                My Wishlist
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                {wishlistItems.length}
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body: List of Wishlist Items */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {wishlistItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="font-serif font-bold text-base text-slate-800 mb-1">
                  Your Wishlist is Empty
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  Save your favorite spectacle frames by tapping the heart icon on any product to try them on later!
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-[#000042] text-white text-xs font-bold hover:bg-[#000028] transition-all shadow-md cursor-pointer"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              wishlistItems.map((item, idx) => (
                <div
                  key={`${item.id || item.sku}-${idx}`}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all flex gap-3.5 items-center group"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl bg-white border border-slate-100 p-2 shrink-0 flex items-center justify-center">
                    <img
                      src={item.frontImage || item.image}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                      {item.brand || 'Spectra Optics'}
                    </div>
                    <div className="text-xs font-serif font-bold text-slate-900 truncate">
                      {item.name}
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{item.price}
                      </span>
                      {item.originalPrice && (
                        <span className="text-[11px] text-slate-400 line-through">
                          ₹{item.originalPrice}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-2">
                      {onTryOn && (
                        <button
                          onClick={() => {
                            onClose();
                            onTryOn(item);
                          }}
                          className="px-2.5 py-1 rounded-full bg-white border border-slate-300 text-slate-800 text-[10px] font-bold hover:bg-slate-900 hover:text-white transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-[#00bac6]" />
                          <span>Try On</span>
                        </button>
                      )}

                      {onAddToCart && (
                        <button
                          onClick={() => {
                            onAddToCart(item);
                            if (onRemoveItem) onRemoveItem(item);
                          }}
                          className="px-2.5 py-1 rounded-full bg-[#000042] text-white text-[10px] font-bold hover:bg-[#000028] transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <ShoppingBag className="w-2.5 h-2.5" />
                          <span>Move to Cart</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveItem && onRemoveItem(item)}
                    title="Remove from wishlist"
                    className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {wishlistItems.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {wishlistItems.length} items saved
              </span>
              <button
                onClick={() => {
                  wishlistItems.forEach(item => onAddToCart && onAddToCart(item));
                  onClose();
                }}
                className="px-4 py-2 rounded-full bg-[#000042] text-white text-xs font-bold hover:bg-[#000028] transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Add All to Cart</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
