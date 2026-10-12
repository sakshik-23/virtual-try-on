import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { X, RotateCw, Sparkles, Compass, Play, Pause, ZoomIn, ZoomOut } from 'lucide-react';

export function ThreeSixtyModal({
  isOpen,
  onClose,
  product,
  selectedColor,
  onTryOn
}) {
  const containerRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [activeColor, setActiveColor] = useState(selectedColor);
  const [currentAngleDeg, setCurrentAngleDeg] = useState(0);
  const [isLoadingTexture, setIsLoadingTexture] = useState(true);

  // Sync activeColor when prop changes
  useEffect(() => {
    if (selectedColor) {
      setActiveColor(selectedColor);
    } else if (product?.availableColors?.length) {
      setActiveColor(product.availableColors[0]);
    }
  }, [selectedColor, product]);

  useEffect(() => {
    if (!isOpen || !product || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene setup - Crisp luxury studio lighting & pure white backdrop
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // 2. Camera: Positioned with generous framing so the ENTIRE pair of specs is visible
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(1.4, 0.35, 4.4);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. OrbitControls for smooth 360 degree rotation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = isAutoRotating;
    controls.autoRotateSpeed = 2.0;
    controls.maxDistance = 6.5;
    controls.minDistance = 2.2;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      setHasInteracted(true);
    });

    // 5. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf8fafc, 1.2);
    fillLight.position.set(-4, 2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xe2e8f0, 1.2);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // 6. Render the EXACT SPECTACLES DISPLAYED IN THE CARD (Clean, floating, no cylinder plate below)
    setIsLoadingTexture(true);
    const eyewearGroup = new THREE.Group();
    scene.add(eyewearGroup);

    // Prioritize exact transparent cutout from the card image
    const frameImageSrc = product.frontImage || product.image;
    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(
      frameImageSrc,
      (texture) => {
        setIsLoadingTexture(false);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const imgWidth = texture.image.naturalWidth || texture.image.width || 1024;
        const imgHeight = texture.image.naturalHeight || texture.image.height || 1024;
        const aspect = imgWidth / imgHeight;

        // Perfectly proportioned frame width (2.4) ensuring the entire eyewear with both arms fits comfortably without clipping
        const frameW = 2.45;
        const frameH = frameW / aspect;

        const frameGeom = new THREE.PlaneGeometry(frameW, frameH, 32, 16);

        // Center geometry bounding box to ensure perfectly balanced placement
        frameGeom.center();

        // Subtle anatomical base-curve wrap
        const pos = frameGeom.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const px = pos.getX(i);
          const zWrap = -Math.pow(px / (frameW * 0.5), 2) * 0.12;
          pos.setZ(i, pos.getZ(i) + zWrap);
        }
        frameGeom.computeVertexNormals();

        const frameMat = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.04,
          roughness: 0.25,
          metalness: 0.15,
          side: THREE.DoubleSide
        });

        // Layer 1: Front
        const frontMesh = new THREE.Mesh(frameGeom, frameMat);
        frontMesh.position.set(0, 0, 0.015);
        eyewearGroup.add(frontMesh);

        // Layer 2: Rear depth offset for tangible 3D thickness
        const rearMesh = new THREE.Mesh(frameGeom, frameMat);
        rearMesh.position.set(0, 0, -0.015);
        eyewearGroup.add(rearMesh);
      },
      undefined,
      (err) => {
        console.error('Error loading 360 texture:', err);
        setIsLoadingTexture(false);
      }
    );

    // 7. Animation & Degree Tracking Loop
    let animId = null;
    let lastDeg = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();

      // Track current azimuth angle for the degree dial
      const azimuthRad = controls.getAzimuthalAngle();
      const deg = Math.round(((azimuthRad * 180 / Math.PI) % 360 + 360) % 360);
      if (Math.abs(deg - lastDeg) >= 2) {
        lastDeg = deg;
        setCurrentAngleDeg(deg);
      }

      renderer.render(scene, camera);
    };
    animate();

    // 8. Responsive Resizer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [isOpen, product, activeColor]);

  // View Presets with comfortable camera distances ensuring entire specs are always visible
  const setCameraPreset = (x, y, z) => {
    if (!cameraRef.current || !controlsRef.current) return;
    controlsRef.current.autoRotate = false;
    setIsAutoRotating(false);
    cameraRef.current.position.set(x, y, z);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const toggleAutoRotate = () => {
    if (!controlsRef.current) return;
    const nextState = !isAutoRotating;
    controlsRef.current.autoRotate = nextState;
    setIsAutoRotating(nextState);
  };

  const handleZoom = (direction) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const factor = direction === 'in' ? 0.85 : 1.2;
    cameraRef.current.position.multiplyScalar(factor);
    controlsRef.current.update();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {product.brand}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#000042] text-white">
                360° Studio Interactive View
              </span>
            </div>
            <h3 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
              {product.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D Canvas Viewport */}
        <div className="relative w-full h-[370px] sm:h-[430px] bg-white cursor-grab active:cursor-grabbing select-none">
          <div ref={containerRef} className="w-full h-full" />

          {/* Texture Loading indicator */}
          {isLoadingTexture && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
              <RotateCw className="w-8 h-8 text-[#000042] animate-spin" />
              <span className="text-xs font-semibold text-slate-600">Loading exact 360° studio frame...</span>
            </div>
          )}

          {/* Interactive Hint Indicator */}
          {!hasInteracted && !isLoadingTexture && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-transparent z-10">
              <div className="flex flex-col items-center gap-1.5 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border border-slate-200 text-xs font-semibold text-slate-700 animate-bounce">
                <span className="text-lg">👆</span>
                <span>Drag to rotate in 360° • Pinch / scroll to zoom</span>
              </div>
            </div>
          )}

          {/* Angle Degree Indicator */}
          <div className="absolute top-4 left-6 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-xs font-semibold text-slate-800 border border-slate-200 shadow-sm z-10">
            <Compass className="w-3.5 h-3.5 text-[#000042]" />
            <span>Angle: <strong className="text-[#00bac6]">{currentAngleDeg}°</strong></span>
          </div>

          {/* Floating Controls: View Presets & Zoom */}
          <div className="flex items-center gap-2 absolute bottom-4 left-6 z-10">
            <button
              onClick={() => setCameraPreset(0, 0, 4.6)}
              className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-xs font-semibold text-slate-700 border border-slate-200 shadow-sm transition-all hover:scale-105"
            >
              Front
            </button>
            <button
              onClick={() => setCameraPreset(1.5, 0.35, 4.3)}
              className="px-3 py-1.5 rounded-lg bg-[#000042] text-white text-xs font-semibold shadow-sm transition-all hover:scale-105"
            >
              3/4 Studio
            </button>
            <button
              onClick={() => setCameraPreset(-1.5, 0.35, 4.3)}
              className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-xs font-semibold text-slate-700 border border-slate-200 shadow-sm transition-all hover:scale-105"
            >
              Opposite 3/4
            </button>
            <button
              onClick={() => setCameraPreset(0.8, 0.2, 3.2)}
              className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-xs font-semibold text-slate-700 border border-slate-200 shadow-sm transition-all hover:scale-105"
            >
              Detail
            </button>
          </div>

          {/* Quick Zoom & Auto-Spin Action Bar */}
          <div className="flex items-center gap-1.5 absolute bottom-4 right-6 z-10">
            <button
              onClick={toggleAutoRotate}
              title={isAutoRotating ? "Pause Spin" : "Auto Spin 360°"}
              className={`p-2 rounded-lg text-xs font-semibold border shadow-sm transition-all ${
                isAutoRotating
                  ? 'bg-[#00bac6]/10 text-[#00bac6] border-[#00bac6]/30'
                  : 'bg-white/90 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleZoom('in')}
              title="Zoom In"
              className="p-2 rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-200 shadow-sm transition-all"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom('out')}
              title="Zoom Out"
              className="p-2 rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-200 shadow-sm transition-all"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer Details & Action */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Dimensions</div>
              <div className="text-xs font-bold text-slate-800">
                {product.dimensions.lensWidth}-{product.dimensions.bridgeWidth}-{product.dimensions.templeLength} mm • Size {product.size}
              </div>
            </div>

            {/* Available Colors Swatches in 360 viewer */}
            {product.availableColors && product.availableColors.length > 1 && (
              <div className="border-l border-slate-200 pl-4 flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Colors:</span>
                {product.availableColors.map((color) => {
                  const isSelected = activeColor?.id === color.id;
                  return (
                    <button
                      key={color.id}
                      onClick={() => setActiveColor(color)}
                      title={color.name}
                      className={`w-5 h-5 rounded-full border transition-all ${
                        isSelected
                          ? 'ring-2 ring-[#00bac6] ring-offset-1 scale-110'
                          : 'border-slate-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                if (onTryOn) onTryOn(product);
              }}
              className="px-6 py-2.5 rounded-full bg-[#000042] text-white font-semibold text-xs tracking-wider uppercase hover:bg-[#000028] shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#00bac6]" />
              <span>Try on in AR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
