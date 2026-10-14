import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Glasses, Sparkles, Compass } from 'lucide-react';

export function Navbar({
  cartCount = 0,
  wishlistCount = 0,
  onOpenCart,
  onOpenWishlist,
  onOpenProfile,
  onOpenStyleQuiz,
  currentUser = null
}) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#000042] flex items-center justify-center text-white shadow-md shadow-blue-950/20 group-hover:scale-105 transition-transform">
              <Glasses className="w-5 h-5 text-[#00bac6]" />
            </div>
            <div>
              <span className="font-serif font-extrabold text-xl tracking-tight text-slate-900 block leading-none">
                SPECTRA <span className="text-[#000042] font-sans font-bold text-xs uppercase tracking-widest block text-slate-500">OPTICS</span>
              </span>
            </div>
          </Link>

          {/* Navigation Routes */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-700">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `hover:text-slate-900 transition-colors py-1 ${
                  isActive ? 'text-slate-900 font-bold border-b-2 border-[#000042]' : ''
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/eyeglasses"
              className={({ isActive }) =>
                `hover:text-slate-900 transition-colors py-1 ${
                  isActive ? 'text-slate-900 font-bold border-b-2 border-[#000042]' : ''
                }`
              }
            >
              Eyeglasses
            </NavLink>
            <NavLink
              to="/sunglasses"
              className={({ isActive }) =>
                `hover:text-slate-900 transition-colors py-1 ${
                  isActive ? 'text-slate-900 font-bold border-b-2 border-[#000042]' : ''
                }`
              }
            >
              Sunglasses
            </NavLink>
            <NavLink
              to="/try-on"
              className={({ isActive }) =>
                `hover:text-slate-900 transition-colors py-1 flex items-center gap-1.5 ${
                  isActive ? 'text-slate-900 font-bold border-b-2 border-[#000042]' : 'text-slate-700'
                }`
              }
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00bac6]" />
              <span>3D Try On</span>
            </NavLink>
          </nav>
        </div>

        {/* Right: Search, Style Quiz, Wishlist & Cart */}
        <div className="flex items-center gap-3.5">
          {/* AI Style & Outfit Matcher Button */}
          {onOpenStyleQuiz && (
            <button
              onClick={onOpenStyleQuiz}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#000042]" />
              <span>Style & Outfit Matcher</span>
            </button>
          )}

          {/* Search Box */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 w-56 text-xs text-slate-500">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search frames..."
              className="bg-transparent border-none outline-none w-full text-slate-800 placeholder-slate-400 text-xs"
            />
          </div>

          {/* Wishlist */}
          <button
            onClick={onOpenWishlist}
            aria-label="View Wishlist"
            className="relative p-2 text-slate-700 hover:text-rose-600 transition-colors cursor-pointer rounded-full hover:bg-slate-100"
          >
            <Heart className={`w-5 h-5 ${wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : ''}`} />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Shopping Bag / Cart */}
          <button
            onClick={onOpenCart}
            aria-label="View Shopping Cart"
            className="relative p-2 text-slate-700 hover:text-[#000042] transition-colors cursor-pointer rounded-full hover:bg-slate-100"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#000042] text-white text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Account Profile / Sign In */}
          <button
            onClick={onOpenProfile}
            aria-label={currentUser ? `Profile of ${currentUser.name}` : "Sign In or Register"}
            className="flex items-center gap-1.5 p-1 sm:p-1.5 text-slate-700 hover:text-[#000042] transition-all cursor-pointer rounded-full hover:bg-slate-100 hidden sm:flex"
          >
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#000042] text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  {currentUser.initials || currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-slate-800 hidden md:inline max-w-[100px] truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 hover:border-[#000042] hover:bg-slate-50 transition-all">
                <User className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-700">
                  Sign In
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
