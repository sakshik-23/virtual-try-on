import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  Camera,
  Trash2,
  Sparkles,
  ShieldCheck,
  Heart,
  ShoppingBag,
  CheckCircle2,
  LogOut,
  ArrowRight,
  UserPlus,
  LogIn,
  Loader2
} from 'lucide-react';
import { authService } from '../services/authService';

export function UserProfileModal({
  isOpen,
  onClose,
  currentUser = null,
  onUpdateUser,
  userSelfie = null,
  faceMetrics = null,
  onOpenTryOn,
  onClearFaceData,
  wishlistCount = 0,
  cartCount = 0
}) {
  if (!isOpen) return null;

  // Auth Mode: 'signin' or 'register'
  const [authMode, setAuthMode] = useState('signin');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Register Form State
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  // Validation / Error state
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pdMm = faceMetrics?.measuredPdMm || 63.5;
  const faceWidthMm = faceMetrics?.measuredFaceWidthMm || 138;
  const recommendedSize = faceMetrics?.recommendedSize || 'Medium';

  // Handle Sign In submission to database API
  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!signInEmail.trim()) {
      setErrorMsg('Please enter your email or mobile number.');
      return;
    }
    if (!signInPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await authService.login({
        email: signInEmail.trim(),
        password: signInPassword
      });
      if (onUpdateUser) onUpdateUser(user);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Registration submission to database API
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!registerName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!registerEmail.trim() || !registerEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!registerPassword || registerPassword.length < 4) {
      setErrorMsg('Please enter a password with at least 4 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newUser = await authService.register({
        name: registerName.trim(),
        email: registerEmail.trim(),
        password: registerPassword,
        phone: registerPhone.trim() || null
      });
      if (onUpdateUser) onUpdateUser(newUser);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = () => {
    if (onUpdateUser) onUpdateUser(null);
    setAuthMode('signin');
    setSignInEmail('');
    setSignInPassword('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        
        {/* ================= MODAL HEADER ================= */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          {currentUser ? (
            /* Logged-In User Header */
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#000042] text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                {currentUser.initials || currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-serif font-bold text-slate-900 leading-snug">
                    {currentUser.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    {currentUser.memberType || 'Gold Member'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {currentUser.email}
                </p>
              </div>
            </div>
          ) : (
            /* Guest / Auth Screen Header */
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-[#000042] flex items-center justify-center font-bold shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 leading-snug">
                  Welcome to Spectra Optics
                </h2>
                <p className="text-xs text-slate-500">
                  Sign in or create your profile to manage live 3D try-on & orders
                </p>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= MODAL BODY ================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

          {/* If NOT logged in: Show Sign In or Register Tabs & Form */}
          {!currentUser ? (
            <div className="space-y-5">
              {/* Sign In vs Register Segmented Control Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMsg('');
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-white text-[#000042] shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMsg('');
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-white text-[#000042] shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register New User</span>
                </button>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {errorMsg}
                </div>
              )}

              {/* TAB 1: Sign In Form */}
              {authMode === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address or Mobile Number
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="enter your email or mobile number"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#000042] focus:ring-2 focus:ring-[#000042]/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#000042] focus:ring-2 focus:ring-[#000042]/10 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-full bg-[#000042] text-white text-xs font-bold hover:bg-[#000028] disabled:opacity-70 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#00bac6]" />
                        <span>Signing In to Database...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-slate-500 pt-1">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setErrorMsg('');
                      }}
                      className="font-bold text-[#000042] hover:underline cursor-pointer"
                    >
                      Register here
                    </button>
                  </p>
                </form>
              )}

              {/* TAB 2: Register Form */}
              {authMode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#000042] focus:ring-2 focus:ring-[#000042]/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#000042] focus:ring-2 focus:ring-[#000042]/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#000042] focus:ring-2 focus:ring-[#000042]/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Create Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="At least 4 characters"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#000042] focus:ring-2 focus:ring-[#000042]/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Free Gold Membership automatically unlocked with your registration!</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-full bg-[#000042] text-white text-xs font-bold hover:bg-[#000028] disabled:opacity-70 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#00bac6]" />
                        <span>Creating Account in Database...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Create Account & Register</span>
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-slate-500 pt-1">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setErrorMsg('');
                      }}
                      className="font-bold text-[#000042] hover:underline cursor-pointer"
                    >
                      Sign In to existing account
                    </button>
                  </p>
                </form>
              )}
            </div>
          ) : (
            /* If LOGGED IN: Show Live User Profile Details */
            <>
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
            </>
          )}

        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className={`p-4 border-t border-slate-100 bg-white flex items-center ${currentUser ? 'justify-between' : 'justify-end'}`}>
          {currentUser && (
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-full border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out / Switch User</span>
            </button>
          )}

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
