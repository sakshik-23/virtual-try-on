import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { X, Sparkles, RotateCcw } from 'lucide-react';

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
  const initialCameraPos = useRef(new THREE.Vector3(0, 0.35, 4.2));
  const [activeColor, setActiveColor] = useState(selectedColor);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

    setIsLoading(true);
    const container = containerRef.current;
    const width = container.clientWidth || 680;
    const height = container.clientHeight || 480;

    // 1. Crisp Pure White Luxury Studio Scene (Exact Match to Reference Video)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // 2. Perspective Camera positioned for natural eyewear showroom viewing
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.copy(initialCameraPos.current);
    cameraRef.current = camera;

    // 3. WebGL Renderer with High-End Color Tone Mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Free 360° Orbital Controls in All Directions (Yaw, Pitch, Roll, Zoom)
    // Matches ref_videos/Recording 2026-10-13 100233.mp4
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
    controls.maxDistance = 6.5;
    controls.minDistance = 2.0;
    // Set orbital rotation pivot exactly at volumetric center of glasses
    controls.target.set(0, 0, -0.65);
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      setHasInteracted(true);
      controls.autoRotate = false; // Stop auto-rotate immediately upon user drag
    });

    // 5. Studio Lighting Rig - Balanced to illuminate frame and prevent lens glare
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf8fafc, 1.4);
    fillLight.position.set(-4, 3, 3);
    scene.add(fillLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 1.6);
    topLight.position.set(0, 6, 0);
    scene.add(topLight);

    const rimLight = new THREE.DirectionalLight(0xfff7ed, 1.3);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // 6. Soft Realistic Studio Radial Floor Contact Shadow (Exact Match to Video!)
    const shadowGeom = new THREE.PlaneGeometry(4.4, 2.8);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.20)');
    grad.addColorStop(0.35, 'rgba(15, 23, 42, 0.07)');
    grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.012)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -0.75, -0.8);
    scene.add(shadowMesh);

    // 7. BUILD PRODUCT-AUTHENTIC 3D EYEWEAR MODEL
    // Uses the EXACT photograph of the frame from the card, with physical 3D temple arms
    // Completely removes cloudy/cataract artificial lens patches for optical clarity!
    const glassesGroup = new THREE.Group();
    scene.add(glassesGroup);

    const textureUrl = product.frontImage || product.image;
    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(
      textureUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;

        const imgW = texture.image?.width || 900;
        const imgH = texture.image?.height || 320;
        const aspect = imgW / imgH;

        const frameHeight = 0.98;
        const frameWidth = frameHeight * aspect;

        buildAuthenticShowroom3DModel(glassesGroup, product, activeColor, texture, frameWidth, frameHeight);
        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.warn('Texture load fallback:', err);
        buildAuthenticShowroom3DModel(glassesGroup, product, activeColor, null, 2.6, 0.98);
        setIsLoading(false);
      }
    );

    // 8. Animation Render Loop
    let animId = null;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 680;
      const h = container.clientHeight || 480;
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

  // Reset Camera View
  const handleResetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.copy(initialCameraPos.current);
      controlsRef.current.target.set(0, 0, -0.65);
      controlsRef.current.autoRotate = true;
      setHasInteracted(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Minimalist Studio Lightbox Header (Exact Match to Reference Video) */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {product.brand}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#000042] text-white">
                360° Free 3D View
              </span>
            </div>
            <h3 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
              {product.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close 360 viewer"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D WebGL Canvas Viewport (Free 360° Drag & Orbit in All Directions!) */}
        <div className="relative w-full h-[400px] sm:h-[460px] bg-white cursor-grab active:cursor-grabbing select-none">
          <div ref={containerRef} className="w-full h-full" />

          {/* First-time Interaction Hint */}
          {!hasInteracted && !isLoading && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-transparent z-10">
              <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-200 text-xs font-semibold text-slate-700 animate-bounce">
                <span>👆</span>
                <span>Drag to rotate 360° in any direction</span>
              </div>
            </div>
          )}

          {/* Reset View Button */}
          <button
            onClick={handleResetCamera}
            title="Reset Angle"
            className="absolute bottom-4 left-6 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-xs font-semibold text-slate-700 border border-slate-200 shadow-sm transition-all hover:scale-105"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#000042]" />
            <span>Reset View</span>
          </button>
        </div>

        {/* Footer Details: Dimensions & Try on in AR */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Dimensions</div>
              <div className="text-xs font-bold text-slate-800">
                {product.dimensions.lensWidth}-{product.dimensions.bridgeWidth}-{product.dimensions.templeLength} mm • Size {product.size}
              </div>
            </div>

            {/* Color Swatches Switcher */}
            {product.availableColors && product.availableColors.length > 1 && (
              <div className="border-l border-slate-200 pl-4 flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Color:</span>
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

/**
 * Builds the Authentic Showroom 3D Eyewear Model:
 * 1. Crystal-Clear Optical Lenses: Completely removes artificial cloudy reflection patches!
 * 2. Front Frame: Textured with the exact photography of the frame from the card, layered with realistic depth.
 * 3. 3D Temple Arms: Seamlessly connecting at the outer hinges, traveling straight back along -Z to Z = -2.5 with ergonomic ear hooks.
 * 4. 3D Silicone Nose Pads: Mounted behind the bridge for metal/hybrid frames.
 */
function buildAuthenticShowroom3DModel(group, product, activeColor, texture, frameWidth, frameHeight) {
  const shape = product.shape || 'wayfarer';
  const id = product.id || '';
  const isMetal = shape === 'round' || shape === 'rectangle';
  const isTortoise = id.includes('tortoise');
  const isClubmaster = id.includes('clubmaster');
  const isWayfarer = shape === 'wayfarer' && !isClubmaster;

  // Frame Color for Temples & Accents
  const frameColorHex = activeColor?.hex || (
    shape === 'round' && id.includes('gold') ? '#d4af37' :
    shape === 'round' ? '#b76e79' :
    shape === 'rectangle' ? '#1f2937' :
    shape === 'cat-eye' ? '#c8a86a' :
    isTortoise ? '#5c3317' :
    '#1c1c1e'
  );

  // Temple Materials
  const templeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(frameColorHex),
    metalness: isMetal || shape === 'cat-eye' ? 0.85 : 0.08,
    roughness: isMetal || shape === 'cat-eye' ? 0.2 : 0.25
  });

  // Ear hook tips: tortoiseshell/black acetate for metal wires (matching card photos!), or matching acetate
  const earTipColor = isMetal || shape === 'cat-eye'
    ? (id.includes('gold') || id.includes('rosegold') ? '#422410' : shape === 'cat-eye' ? '#6b2148' : '#18181b')
    : frameColorHex;

  const earTipMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(earTipColor),
    metalness: 0.08,
    roughness: 0.35
  });

  // Translucent Silicone Nose Pads
  const siliconePadMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xffffff),
    transparent: true,
    opacity: 0.85,
    transmission: 0.7,
    roughness: 0.25,
    ior: 1.45
  });

  // 1. FRONT FRAME MESH (Textured with the EXACT SPECTACLES from the card!)
  // Sits cleanly in 3D with realistic rim thickness and zero cloudy lens artifacts
  if (texture) {
    const frontGeom = new THREE.PlaneGeometry(frameWidth, frameHeight);
    const frontMat = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.02,
      roughness: isMetal ? 0.3 : 0.35,
      metalness: isMetal ? 0.7 : 0.08,
      side: THREE.DoubleSide
    });

    // Layer 1: Front facing frame
    const frontMesh = new THREE.Mesh(frontGeom, frontMat);
    frontMesh.position.set(0, 0, 0);
    group.add(frontMesh);

    // Layer 2: Subtle depth backing at Z = -0.015 gives physical volumetric rim thickness
    const backMesh = new THREE.Mesh(frontGeom, frontMat);
    backMesh.position.set(0, 0, -0.015);
    group.add(backMesh);
  }

  // NOTE: We intentionally do NOT add artificial circular lens geometry meshes here!
  // The PNG texture itself has natural optical transparency, ensuring crystal-clear store showroom clarity without any foggy cataract patches!

  // 2. PHYSICAL 3D TEMPLE ARMS & HINGES (Connecting from outer rim to Z = -2.5)
  // Calculate exact hinge attachment coordinates based on frame silhouette
  const hingeFractionX = isWayfarer ? 0.90 : isClubmaster ? 0.91 : 0.93;
  const hingeFractionY = isWayfarer ? 0.16 : shape === 'cat-eye' ? 0.22 : isClubmaster ? 0.19 : 0.08;

  const hingeX = (frameWidth / 2) * hingeFractionX;
  const hingeY = frameHeight * hingeFractionY;

  const stemRadius = isMetal ? 0.016 : 0.024;
  const hookRadius = isMetal ? 0.022 : 0.029;

  for (let side of [-1, 1]) {
    const x = side * hingeX;

    // Metallic Hinge Barrel
    const hingeGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.05, 12);
    const hingeMesh = new THREE.Mesh(hingeGeom, templeMat);
    hingeMesh.position.set(x, hingeY, -0.015);
    group.add(hingeMesh);

    // Part A: Front Temple Stem (traveling straight back along -Z to Z = -1.6)
    // Naturally tapers inward toward the ears matching anatomical head curvature
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, hingeY, -0.02),
      new THREE.Vector3(x * 0.94, hingeY, -0.8),
      new THREE.Vector3(x * 0.88, hingeY - 0.01, -1.6)
    ]);
    const stemGeom = new THREE.TubeGeometry(stemCurve, 24, stemRadius, 10, false);
    const stemMesh = new THREE.Mesh(stemGeom, templeMat);
    group.add(stemMesh);

    // Part B: Ergonomic Ear Hook with Acetate Sleeve Tip (curving down to Z = -2.45)
    // Tucks neatly behind the ear, visible cleanly through transparent lenses
    const hookCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x * 0.88, hingeY - 0.01, -1.6),
      new THREE.Vector3(x * 0.85, hingeY - 0.08, -2.05),
      new THREE.Vector3(x * 0.82, hingeY - 0.38, -2.45)
    ]);
    const hookGeom = new THREE.TubeGeometry(hookCurve, 20, hookRadius, 10, false);
    const hookMesh = new THREE.Mesh(hookGeom, earTipMat);
    group.add(hookMesh);

    // Silicone Nose Pads (for metal/wireframe and hybrid frames only)
    if (isMetal || isClubmaster || shape === 'cat-eye') {
      const padX = side * 0.20;
      const padY = -0.08;
      const padZ = -0.06;

      // Thin gooseneck post
      const padArmGeom = new THREE.CylinderGeometry(0.009, 0.009, 0.11, 8);
      const padArmMesh = new THREE.Mesh(padArmGeom, templeMat);
      padArmMesh.position.set(padX, padY, padZ);
      padArmMesh.rotation.z = side * 0.45;
      padArmMesh.rotation.x = 0.25;
      group.add(padArmMesh);

      // Oval silicone cushion tucked behind the nasal bridge
      const padGeom = new THREE.CapsuleGeometry(0.03, 0.06, 8, 12);
      const padMesh = new THREE.Mesh(padGeom, siliconePadMat);
      padMesh.position.set(padX + side * 0.015, padY - 0.04, padZ - 0.02);
      padMesh.rotation.z = side * 0.35;
      group.add(padMesh);
    }
  }
}
