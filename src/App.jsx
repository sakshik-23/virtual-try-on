import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { TryOnPage } from './pages/TryOnPage';
import { ThreeSixtyModal } from './components/ThreeSixtyModal';
import { StyleQuizModal } from './components/StyleQuizModal';
import { CartDrawer } from './components/CartDrawer';
import { EYEWEAR_CATALOG } from './services/catalogData';

export default function App() {
  const navigate = useNavigate();

  const [activeProduct, setActiveProduct] = useState(EYEWEAR_CATALOG[0]);
  const [activeColor, setActiveColor] = useState(EYEWEAR_CATALOG[0].availableColors[0]);
  const [activeLens, setActiveLens] = useState(EYEWEAR_CATALOG[0].availableLensTints[0]);

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

  // 3D Try-On Active Toggle (Screenshot 5)
  const [is3DTryOnActive, setIs3DTryOnActive] = useState(true);

  // Modals State
  const [is360ModalOpen, setIs360ModalOpen] = useState(false);
  const [productFor360, setProductFor360] = useState(EYEWEAR_CATALOG[0]);
  const [colorFor360, setColorFor360] = useState(EYEWEAR_CATALOG[0].availableColors[0]);

  const [isStyleQuizOpen, setIsStyleQuizOpen] = useState(false);

  // Cart Drawer State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('spectra_tryon_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('spectra_tryon_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Cart storage error', e);
    }
  }, [cartItems]);

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
    navigate('/try-on');
  };

  const handleAddToCart = (product) => {
    setCartItems(prev => [...prev, product || activeProduct]);
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-[#000042] selection:text-white">
      {/* 1. Clean White Navbar */}
      <Navbar
        cartCount={cartItems.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenStyleQuiz={() => setIsStyleQuizOpen(true)}
      />

      {/* 2. Main Content Managed by React Router */}
      <main className="flex-1 w-full">
        <Routes>
          {/* Eyeglasses Route (Home) */}
          <Route
            path="/"
            element={
              <ProductCatalog
                category="eyeglasses"
                onSelectProduct={(p) => navigate(`/product/${p.id}`)}
                onOpen360={handleOpen360}
                onOpenLiveTryOn={handleOpenLiveTryOn}
                onAddToCart={handleAddToCart}
                userSelfie={userSelfie}
                faceMetrics={faceMetrics}
                is3DTryOnActive={is3DTryOnActive}
                onToggle3DTryOn={() => setIs3DTryOnActive(!is3DTryOnActive)}
              />
            }
          />

          <Route
            path="/eyeglasses"
            element={
              <ProductCatalog
                category="eyeglasses"
                onSelectProduct={(p) => navigate(`/product/${p.id}`)}
                onOpen360={handleOpen360}
                onOpenLiveTryOn={handleOpenLiveTryOn}
                onAddToCart={handleAddToCart}
                userSelfie={userSelfie}
                faceMetrics={faceMetrics}
                is3DTryOnActive={is3DTryOnActive}
                onToggle3DTryOn={() => setIs3DTryOnActive(!is3DTryOnActive)}
              />
            }
          />

          {/* Sunglasses Route */}
          <Route
            path="/sunglasses"
            element={
              <ProductCatalog
                category="sunglasses"
                onSelectProduct={(p) => navigate(`/product/${p.id}`)}
                onOpen360={handleOpen360}
                onOpenLiveTryOn={handleOpenLiveTryOn}
                onAddToCart={handleAddToCart}
                userSelfie={userSelfie}
                faceMetrics={faceMetrics}
                is3DTryOnActive={is3DTryOnActive}
                onToggle3DTryOn={() => setIs3DTryOnActive(!is3DTryOnActive)}
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
              />
            }
          />

          {/* Dedicated Product Detail Route */}
          <Route
            path="/product/:id"
            element={
              <ProductDetailPage
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
      <footer className="w-full border-t border-slate-200 bg-[#f9fafb] py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 font-medium">
            <span className="font-bold text-slate-800">SPECTRA OPTICS 3D VIRTUAL STUDIO</span>
            <span>•</span>
            <span>Real-Time WebGL & MediaPipe Engine</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Client-Side Biometric Privacy</span>
            <span>•</span>
            <span>ACID-Compliant Architecture</span>
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
        onRemoveItem={(idx) => setCartItems(prev => prev.filter((_, i) => i !== idx))}
      />
    </div>
  );
}
