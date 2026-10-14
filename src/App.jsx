import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { TryOnPage } from './pages/TryOnPage';
import { HomePage } from './pages/HomePage';
import { ThreeSixtyModal } from './components/ThreeSixtyModal';
import { StyleQuizModal } from './components/StyleQuizModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { UserProfileModal } from './components/UserProfileModal';
import { LiveLookModal } from './components/LiveLookModal';
import { EYEWEAR_CATALOG } from './services/catalogData';
import { productRepository } from './services/productRepository';

export default function App() {
  const navigate = useNavigate();

  const [catalogProducts, setCatalogProducts] = useState(EYEWEAR_CATALOG);
  const [backendLive, setBackendLive] = useState(false);

  const [activeProduct, setActiveProduct] = useState(EYEWEAR_CATALOG[0]);
  const [activeColor, setActiveColor] = useState(EYEWEAR_CATALOG[0].availableColors[0]);
  const [activeLens, setActiveLens] = useState(EYEWEAR_CATALOG[0].availableLensTints[0]);

  // Sync products and health with live FastAPI backend on mount
  useEffect(() => {
    let isMounted = true;
    async function initBackendSync() {
      try {
        const isHealthy = await productRepository.checkHealth();
        if (isMounted) setBackendLive(isHealthy);
        if (isHealthy) {
          const liveProducts = await productRepository.getAllProducts();
          if (isMounted && liveProducts && liveProducts.length > 0) {
            setCatalogProducts(liveProducts);
            setActiveProduct(prev => liveProducts.find(p => p.sku === prev.sku) || liveProducts[0]);
          }
        }
      } catch (err) {
        console.warn('Backend connection initial sync check:', err);
      }
    }
    initBackendSync();
    return () => { isMounted = false; };
  }, []);

  // User 3D Selfie State
  const [userSelfie, setUserSelfie] = useState(() => {
    try {
      return localStorage.getItem('spectra_user_selfie') || null;
    } catch {
      return null;
    }
  });

  // User 3D Face Metrics State (landmarks, PD, tilt, face width)
  const [faceMetrics, setFaceMetrics] = useState(() => {
    try {
      const saved = localStorage.getItem('spectra_face_metrics');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 3D Try-On Active Toggle (off by default so catalog shows clean product cards)
  const [is3DTryOnActive, setIs3DTryOnActive] = useState(false);

  // Modals State
  const [is360ModalOpen, setIs360ModalOpen] = useState(false);
  const [productFor360, setProductFor360] = useState(EYEWEAR_CATALOG[0]);
  const [colorFor360, setColorFor360] = useState(EYEWEAR_CATALOG[0].availableColors[0]);

  const [isStyleQuizOpen, setIsStyleQuizOpen] = useState(false);
  const [liveLookProduct, setLiveLookProduct] = useState(null);

  // User Authentication State (defaults to null so user is prompted to sign in or register)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('spectra_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Cart Drawer State (tied to active user session - starts empty if logged out)
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedUser = localStorage.getItem('spectra_user');
      if (!savedUser) {
        localStorage.removeItem('spectra_tryon_cart');
        return [];
      }
      const userObj = JSON.parse(savedUser);
      const userKey = userObj.id || userObj.email;
      const saved = localStorage.getItem(`spectra_cart_${userKey}`) || localStorage.getItem('spectra_tryon_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist Drawer State (tied to active user session - starts empty if logged out)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const savedUser = localStorage.getItem('spectra_user');
      if (!savedUser) {
        localStorage.removeItem('spectra_tryon_wishlist');
        return [];
      }
      const userObj = JSON.parse(savedUser);
      const userKey = userObj.id || userObj.email;
      const saved = localStorage.getItem(`spectra_wishlist_${userKey}`) || localStorage.getItem('spectra_tryon_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Session Manager: Handles Login, Registration, and Clean Logout
  const handleUpdateUser = (user) => {
    setCurrentUser(user);
    try {
      if (user) {
        // User logged in: save session & load their personal cart/wishlist
        localStorage.setItem('spectra_user', JSON.stringify(user));
        const userKey = user.id || user.email;
        const savedCart = localStorage.getItem(`spectra_cart_${userKey}`);
        const savedWishlist = localStorage.getItem(`spectra_wishlist_${userKey}`);
        setCartItems(savedCart ? JSON.parse(savedCart) : []);
        setWishlistItems(savedWishlist ? JSON.parse(savedWishlist) : []);
      } else {
        // User logged out: clear cart, wishlist, close drawers, and return to Home landing page
        localStorage.removeItem('spectra_user');
        localStorage.removeItem('spectra_tryon_cart');
        localStorage.removeItem('spectra_tryon_wishlist');
        setCartItems([]);
        setWishlistItems([]);
        setIsCartOpen(false);
        setIsWishlistOpen(false);
        setIsProfileOpen(false);
        navigate('/');
      }
    } catch (e) {
      console.warn('User session storage error', e);
    }
  };

  // Sync cart items to storage for logged in user
  useEffect(() => {
    try {
      if (currentUser) {
        const userKey = currentUser.id || currentUser.email;
        localStorage.setItem(`spectra_cart_${userKey}`, JSON.stringify(cartItems));
        localStorage.setItem('spectra_tryon_cart', JSON.stringify(cartItems));
      } else {
        if (cartItems.length === 0) {
          localStorage.removeItem('spectra_tryon_cart');
        }
      }
    } catch (e) {
      console.warn('Cart storage error', e);
    }
  }, [cartItems, currentUser]);

  // Sync wishlist items to storage for logged in user
  useEffect(() => {
    try {
      if (currentUser) {
        const userKey = currentUser.id || currentUser.email;
        localStorage.setItem(`spectra_wishlist_${userKey}`, JSON.stringify(wishlistItems));
        localStorage.setItem('spectra_tryon_wishlist', JSON.stringify(wishlistItems));
      } else {
        if (wishlistItems.length === 0) {
          localStorage.removeItem('spectra_tryon_wishlist');
        }
      }
    } catch (e) {
      console.warn('Wishlist storage error', e);
    }
  }, [wishlistItems, currentUser]);

  const handlePhotoCaptured = (photoUrl, metrics) => {
    setUserSelfie(photoUrl);
    setIs3DTryOnActive(true);
    if (metrics) {
      setFaceMetrics(metrics);
      try {
        localStorage.setItem('spectra_face_metrics', JSON.stringify(metrics));
      } catch (e) {
        console.warn('Metrics storage quota', e);
      }
    }
    try {
      localStorage.setItem('spectra_user_selfie', photoUrl);
    } catch (e) {
      console.warn('Selfie storage quota', e);
    }
  };

  const handleOpen360 = (product, color) => {
    setProductFor360(product);
    setColorFor360(color || product.availableColors[0]);
    setIs360ModalOpen(true);
  };

  const handleOpenLiveTryOn = (product) => {
    setActiveProduct(product);
    setActiveColor(product.availableColors[0]);
    setActiveLens(product.availableLensTints[0]);
    setLiveLookProduct(product);
  };

  const handleAddToCart = (product) => {
    setCartItems(prev => [...prev, product || activeProduct]);
    setIsCartOpen(true);
  };

  const handleToggleWishlist = (product) => {
    setWishlistItems(prev => {
      const exists = prev.some(item => item.id === product.id || item.sku === product.sku);
      if (exists) {
        return prev.filter(item => item.id !== product.id && item.sku !== product.sku);
      } else {
        return [...prev, product];
      }
    });
  };

  // User Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleClearFaceData = () => {
    setUserSelfie(null);
    setFaceMetrics(null);
    try {
      localStorage.removeItem('spectra_user_selfie');
      localStorage.removeItem('spectra_face_metrics');
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-[#000042] selection:text-white">
      {/* 1. Clean White Navbar */}
      <Navbar
        cartCount={cartItems.length}
        wishlistCount={wishlistItems.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenStyleQuiz={() => setIsStyleQuizOpen(true)}
        currentUser={currentUser}
      />

      {/* 2. Main Content Managed by React Router */}
      <main className="flex-1 w-full">
        <Routes>
          {/* Home Landing Page Route */}
          <Route
            path="/"
            element={
              <HomePage
                catalogProducts={catalogProducts}
                onOpenLiveTryOn={handleOpenLiveTryOn}
                onOpen360={handleOpen360}
                onOpenStyleQuiz={() => setIsStyleQuizOpen(true)}
                onAddToCart={handleAddToCart}
              />
            }
          />

          <Route
            path="/eyeglasses"
            element={
              <ProductCatalog
                category="eyeglasses"
                catalogProducts={catalogProducts}
                backendLive={backendLive}
                onSelectProduct={(p) => navigate(`/product/${p.id}`)}
                onOpen360={handleOpen360}
                onOpenLiveTryOn={handleOpenLiveTryOn}
                onAddToCart={handleAddToCart}
                userSelfie={userSelfie}
                faceMetrics={faceMetrics}
                is3DTryOnActive={is3DTryOnActive}
                onToggle3DTryOn={() => setIs3DTryOnActive(!is3DTryOnActive)}
                wishlistItems={wishlistItems}
                onToggleWishlist={handleToggleWishlist}
              />
            }
          />

          {/* Sunglasses Route */}
          <Route
            path="/sunglasses"
            element={
              <ProductCatalog
                category="sunglasses"
                catalogProducts={catalogProducts}
                backendLive={backendLive}
                onSelectProduct={(p) => navigate(`/product/${p.id}`)}
                onOpen360={handleOpen360}
                onOpenLiveTryOn={handleOpenLiveTryOn}
                onAddToCart={handleAddToCart}
                userSelfie={userSelfie}
                faceMetrics={faceMetrics}
                is3DTryOnActive={is3DTryOnActive}
                onToggle3DTryOn={() => setIs3DTryOnActive(!is3DTryOnActive)}
                wishlistItems={wishlistItems}
                onToggleWishlist={handleToggleWishlist}
              />
            }
          />

          {/* 3D Virtual Try-On Route */}
          <Route
            path="/try-on"
            element={
              <TryOnPage
                activeProduct={activeProduct}
                activeColor={activeColor}
                activeLens={activeLens}
                onSelectProduct={setActiveProduct}
                onSelectColor={setActiveColor}
                onSelectLens={setActiveLens}
                onPhotoCaptured={handlePhotoCaptured}
                userSelfie={userSelfie}
                onOpen360={handleOpen360}
                onOpenStyleQuiz={() => setIsStyleQuizOpen(true)}
                onGoToDittoGrid={() => {
                  setIs3DTryOnActive(true);
                  navigate('/');
                }}
              />
            }
          />

          <Route
            path="/compare-looks"
            element={
              <TryOnPage
                activeProduct={activeProduct}
                activeColor={activeColor}
                activeLens={activeLens}
                onSelectProduct={setActiveProduct}
                onSelectColor={setActiveColor}
                onSelectLens={setActiveLens}
                onPhotoCaptured={handlePhotoCaptured}
                userSelfie={userSelfie}
                onOpen360={handleOpen360}
                onOpenStyleQuiz={() => setIsStyleQuizOpen(true)}
                onGoToDittoGrid={() => {
                  setIs3DTryOnActive(true);
                  navigate('/');
                }}
              />
            }
          />

          {/* Dedicated Product Detail Route */}
          <Route
            path="/product/:id"
            element={
              <ProductDetailPage
                catalogProducts={catalogProducts}
                onOpen360={handleOpen360}
                onOpenLiveTryOn={handleOpenLiveTryOn}
                onAddToCart={handleAddToCart}
                userSelfie={is3DTryOnActive ? userSelfie : null}
                faceMetrics={faceMetrics}
              />
            }
          />
        </Routes>
      </main>

      {/* 3. Clean Footer */}
      <footer className="w-full border-t border-slate-200 bg-[#f9fafb] py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 font-medium">
            <span className="font-bold text-slate-800">SPECTRA OPTICS 3D VIRTUAL STUDIO</span>
            <span>•</span>
            <span>Real-Time WebGL & MediaPipe Engine</span>
          </div>

          <div className="text-slate-400">
            © {new Date().getFullYear()} Spectra Optics. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Modals */}
      {/* 1. 360-Degree Interactive 3D Specs Viewer */}
      <ThreeSixtyModal
        isOpen={is360ModalOpen}
        onClose={() => setIs360ModalOpen(false)}
        product={productFor360}
        selectedColor={colorFor360}
        onTryOn={(p) => handleOpenLiveTryOn(p)}
      />

      {/* 2. AI Style & Outfit Matcher Quiz Modal */}
      <StyleQuizModal
        isOpen={isStyleQuizOpen}
        onClose={() => setIsStyleQuizOpen(false)}
        onTryOn={(p) => handleOpenLiveTryOn(p)}
      />

      {/* 3. Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        faceMetrics={faceMetrics}
        onRemoveItem={(idx) => setCartItems(prev => prev.filter((_, i) => i !== idx))}
      />

      {/* 4. Dynamic Live Look Eyewear Swiping Modal */}
      <LiveLookModal
        isOpen={Boolean(liveLookProduct)}
        onClose={() => setLiveLookProduct(null)}
        initialProduct={liveLookProduct}
        catalogProducts={catalogProducts}
        userSelfie={userSelfie}
        faceMetrics={faceMetrics}
        onAddToCart={handleAddToCart}
        onOpen360={handleOpen360}
      />

      {/* 5. Wishlist Slide-Over Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistItems={wishlistItems}
        onRemoveItem={(item) => handleToggleWishlist(item)}
        onAddToCart={handleAddToCart}
        onTryOn={handleOpenLiveTryOn}
      />

      {/* 6. User Profile & Biometrics Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        userSelfie={userSelfie}
        faceMetrics={faceMetrics}
        onOpenTryOn={() => {
          setIsProfileOpen(false);
          navigate('/try-on');
        }}
        onClearFaceData={handleClearFaceData}
        wishlistCount={wishlistItems.length}
        cartCount={cartItems.length}
      />
    </div>
  );
}
