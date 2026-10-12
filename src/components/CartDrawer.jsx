import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, CheckCircle, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export function CartDrawer({
  isOpen,
  onClose,
  cartItems = [],
  onRemoveItem
}) {
  if (!isOpen) return null;

  const [lensOption, setLensOption] = useState('bluecut');
  const [isOrdered, setIsOrdered] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price || 0), 0);
  const lensAddonPrice = lensOption === 'premium' ? 1200 : lensOption === 'singlevision' ? 500 : 0;
  const totalPrice = subtotal + (cartItems.length > 0 ? lensAddonPrice : 0);

  const handleCheckout = () => {
    setIsOrdered(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#000042', '#00bac6', '#dfa64c', '#10b981']
    });
    setTimeout(() => {
      setIsOrdered(false);
      onClose();
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#000042]" />
            <h3 className="font-serif font-bold text-lg text-slate-900">Your Cart</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
              {cartItems.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Cart Item List */}
          {cartItems.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <ShoppingBag className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Your cart is empty</p>
              <p className="text-xs text-slate-400">Select any frame from the catalog to add to cart.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-12 object-contain bg-white rounded-lg p-1 border border-slate-200 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.brand}</span>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">{item.name}</h4>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Shape: <span className="capitalize">{item.shape}</span> • Size: {item.size}
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 mt-1">₹{item.price}</div>
                  </div>

                  <button
                    onClick={() => onRemoveItem(index)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Lens Package Selection */}
          {cartItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Lens Package:
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setLensOption('bluecut')}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    lensOption === 'bluecut'
                      ? 'bg-blue-50/50 border-[#000042] text-slate-900 ring-1 ring-[#000042]'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">Anti-Glare Zero-Power BLU Lenses</div>
                    <div className="text-[10px] text-slate-500">Blocks harmful digital screen rays</div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">FREE</span>
                </button>

                <button
                  onClick={() => setLensOption('singlevision')}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    lensOption === 'singlevision'
                      ? 'bg-blue-50/50 border-[#000042] text-slate-900 ring-1 ring-[#000042]'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">Single Vision Prescription (Anti-Fog)</div>
                    <div className="text-[10px] text-slate-500">Custom optical powered lenses</div>
                  </div>
                  <span className="text-xs font-bold text-slate-900">+₹500</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Checkout */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal ({cartItems.length} items)</span>
                <span className="font-semibold text-slate-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Lenses Coating</span>
                <span className="font-semibold text-slate-900">{lensAddonPrice === 0 ? 'FREE' : `₹${lensAddonPrice}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping & 3D Trial</span>
                <span className="text-emerald-600 font-semibold">FREE</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span>₹{totalPrice}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isOrdered}
              className="w-full py-4 bg-[#000042] text-white font-extrabold text-xs tracking-wider uppercase shadow-lg hover:bg-[#000028] transition-all flex items-center justify-center gap-2"
            >
              {isOrdered ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Order Placed Successfully!</span>
                </>
              ) : (
                <>
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>1-Year Warranty • 14-Day Free Exchange</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
