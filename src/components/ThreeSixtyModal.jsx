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
  const initialCameraPos = useRef(new THREE.Vector3(0, 0.45, 4.2));
  const [activeColor, setActiveColor] = useState(selectedColor);
  const [hasInteracted, setHasInteracted] = useState(false);

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
    const width = container.clientWidth || 680;
    const height = container.clientHeight || 480;

    // 1. Crisp Pure White Studio Scene (Matches Reference Video!)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // 2. Perspective Camera positioned to view eyewear in natural perspective
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.copy(initialCameraPos.current);
    cameraRef.current = camera;

    // 3. WebGL Renderer with High-End Color Tone Mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Free 360° Orbital Controls in All Directions (Pitch, Yaw, Roll, Zoom)
    // Exactly matches ref_videos/Recording 2026-10-13 100233.mp4
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.4;
    controls.maxDistance = 6.5;
    controls.minDistance = 2.0;
    // Set orbital rotation pivot exactly at volumetric center of glasses
    controls.target.set(0, 0, -0.65);
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      setHasInteracted(true);
      controls.autoRotate = false; // Stop auto rotate immediately upon user drag
    });

    // 5. Studio Lighting Rig for Metallic Lustre & Optical Glass Transparency
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf8fafc, 1.4);
    fillLight.position.set(-4, 3, 3);
    scene.add(fillLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 1.8);
    topLight.position.set(0, 6, 0);
    scene.add(topLight);

    const rimLight = new THREE.DirectionalLight(0xfff7ed, 1.5);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // 6. Soft Realistic Studio Radial Floor Contact Shadow (Exact Match to Video!)
    const shadowGeom = new THREE.PlaneGeometry(4.4, 2.8);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.22)');
    grad.addColorStop(0.35, 'rgba(15, 23, 42, 0.08)');
    grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.015)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -0.75, -0.8);
    scene.add(shadowMesh);

    // 7. BUILD PRODUCT-SPECIFIC 3D EYEWEAR MODEL
    const glassesGroup = buildProductSpecific3DModel(product, activeColor);
    scene.add(glassesGroup);

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
          {!hasInteracted && (
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
 * Builds a Photorealistic 3D Model specifically matching the product's exact geometry and materials:
 * - Wayfarer: Thick sculpted acetate rims, keyhole bridge, silver hinge rivets, tapered acetate temples
 * - Round / Lumina Flex: Geometric wireframe round rims, arched bridge, silicone nose pads, thin metal temples with black acetate tips (matching the video!)
 * - Cat-Eye: Sculpted winged cat-eye upper brow, slender lower rim, silicone pads
 * - Rectangle: Modern rectangular titanium profile, silicone pads, sleek temples
 * - Clubmaster: Bold acetate browline, gold lower wire rims, gold bridge
 */
function buildProductSpecific3DModel(product, activeColor) {
  const group = new THREE.Group();
  const shape = product.shape || 'wayfarer';
  const id = product.id || '';
  const isClubmaster = id.includes('clubmaster');
  const isTortoise = id.includes('tortoise');

  // Determine Materials
  const frameColorHex = activeColor?.hex || (
    shape === 'round' ? '#b76e79' :
    shape === 'rectangle' ? '#1f2937' :
    isTortoise ? '#5c3317' :
    '#1c1c1e'
  );

  const isMetalWire = shape === 'round' || shape === 'rectangle';

  // Frame Material
  const frameMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(frameColorHex),
    metalness: isMetalWire ? 0.85 : 0.08,
    roughness: isMetalWire ? 0.2 : 0.25
  });

  // Secondary Metal Material (for Clubmaster lower wire/bridge, and hinge rivets)
  const goldAccentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xd4af37),
    metalness: 0.9,
    roughness: 0.18
  });

  const silverRivetMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xe2e8f0),
    metalness: 0.95,
    roughness: 0.1
  });

  // Ultra-clean Anti-Reflective Optical Glass Material
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xf0f9ff),
    transparent: true,
    opacity: 0.2,
    roughness: 0.015,
    metalness: 0.05,
    transmission: 0.95,
    ior: 1.52,
    reflectivity: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02
  });

  // Contrasting Black Acetate Temple Tips (as seen in video 00:00 & 00:05!)
  const templeTipMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(isMetalWire ? '#18181b' : frameColorHex),
    metalness: 0.08,
    roughness: 0.35
  });

  // Translucent Silicone Nose Pads
  const siliconePadMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xffffff),
    transparent: true,
    opacity: 0.8,
    transmission: 0.75,
    roughness: 0.25,
    ior: 1.45
  });

  const separation = 0.72; // Bridge center to lens center

  for (let side of [-1, 1]) {
    const rimGroup = new THREE.Group();
    rimGroup.position.x = side * separation;

    let rimMesh, lensMesh;

    if (shape === 'round') {
      // 1. LUMINA ROUND: Slender Panto Geometric Wireframe (Exact match to ref_videos!)
      const R = 0.54;
      const pts = [];
      const numSegments = 36;
      for (let i = 0; i <= numSegments; i++) {
        const theta = (i / numSegments) * Math.PI * 2;
        let r = R;
        if (Math.sin(theta) > 0.3) {
          r *= 0.94; // Gentle flattened panto top arch
        }
        pts.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, 0));
      }
      const roundSpline = new THREE.CatmullRomCurve3(pts, true);
      const rimGeom = new THREE.TubeGeometry(roundSpline, 48, 0.024, 12, true);
      rimMesh = new THREE.Mesh(rimGeom, frameMat);

      const lensGeom = new THREE.CircleGeometry(R - 0.012, 32);
      lensMesh = new THREE.Mesh(lensGeom, lensMat);

      // Silicone Nose Pads on Curved Wire Posts
      addNosePad(group, side, frameMat, siliconePadMat);

      // Metallic Hinge Block
      const hingeX = side * (separation + 0.54);
      addHingeBlock(group, hingeX, 0.08, frameMat);

      // Temple Arm: Slender wire stem + Black Acetate Ear Hook (matches video 00:00)
      addTempleArm(group, hingeX, 0.08, frameMat, templeTipMat, 0.02, 0.032);

    } else if (isClubmaster) {
      // 2. SPECTRA CLUBMASTER: Acetate Top Brow + Gold Lower Eye-Wire
      // Upper Acetate Brow Arch
      const browShape = new THREE.Shape();
      browShape.moveTo(-0.55, 0.05);
      browShape.bezierCurveTo(-0.4, 0.48, 0.4, 0.48, 0.55, 0.15);
      browShape.lineTo(0.55, 0.32);
      browShape.bezierCurveTo(0.35, 0.62, -0.35, 0.62, -0.55, 0.22);
      browShape.closePath();
      const browGeom = new THREE.ExtrudeGeometry(browShape, { depth: 0.07, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012 });
      browGeom.center();
      const browMesh = new THREE.Mesh(browGeom, frameMat);
      browMesh.position.set(0, 0.18, 0.01);
      rimGroup.add(browMesh);

      // Silver Rivet Accent on Brow outer corner
      const rivetGeom = new THREE.CapsuleGeometry(0.015, 0.035, 6, 8);
      const rivetMesh = new THREE.Mesh(rivetGeom, silverRivetMat);
      rivetMesh.position.set(side * 0.42, 0.26, 0.05);
      rivetMesh.rotation.z = Math.PI / 2;
      rimGroup.add(rivetMesh);

      // Lower Gold Wire Rim
      const lowerCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.48, 0.06, 0),
        new THREE.Vector3(-0.38, -0.42, 0),
        new THREE.Vector3(0.38, -0.42, 0),
        new THREE.Vector3(0.48, 0.06, 0)
      ]);
      const lowerGeom = new THREE.TubeGeometry(lowerCurve, 24, 0.018, 10, false);
      const lowerMesh = new THREE.Mesh(lowerGeom, goldAccentMat);
      rimGroup.add(lowerMesh);

      const lensGeom = new THREE.CircleGeometry(0.46, 32);
      lensMesh = new THREE.Mesh(lensGeom, lensMat);

      // Nose Pads
      addNosePad(group, side, goldAccentMat, siliconePadMat);

      // Hinges & Temples
      const hingeX = side * (separation + 0.52);
      addHingeBlock(group, hingeX, 0.2, frameMat);
      addTempleArm(group, hingeX, 0.2, frameMat, frameMat, 0.035, 0.038);

    } else if (shape === 'cat-eye') {
      // 3. VOGUE GLAM CAT-EYE: Sculpted Winged Upper Corners
      const pts = [];
      const flare = side * 0.22;
      const s = new THREE.Shape();
      s.moveTo(-0.44, -0.32);
      s.lineTo(0.44, -0.32);
      s.bezierCurveTo(0.62 + flare, -0.05, 0.72 + flare, 0.52, 0.0, 0.42);
      s.bezierCurveTo(-0.62, 0.42, -0.52, -0.05, -0.44, -0.32);

      const extrudeSettings = { depth: 0.05, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.014, bevelThickness: 0.014 };
      const geom = new THREE.ExtrudeGeometry(s, extrudeSettings);
      geom.center();
      rimMesh = new THREE.Mesh(geom, frameMat);

      const lensGeom = new THREE.ShapeGeometry(s);
      lensGeom.center();
      lensMesh = new THREE.Mesh(lensGeom, lensMat);

      addNosePad(group, side, goldAccentMat, siliconePadMat);

      const hingeX = side * (separation + 0.58);
      addHingeBlock(group, hingeX, 0.16, goldAccentMat);
      addTempleArm(group, hingeX, 0.16, goldAccentMat, templeTipMat, 0.024, 0.034);

    } else if (shape === 'rectangle') {
      // 4. MAVEN EXECUTIVE RECTANGLE: Clean Titanium Profile
      const w = 0.96;
      const h = 0.58;
      const r = 0.10;
      const s = createRoundedRectShape(w, h, r);
      const hole = createRoundedRectShape(w - 0.07, h - 0.07, r * 0.8);
      s.holes.push(hole);

      const geom = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.01, bevelThickness: 0.01 });
      geom.center();
      rimMesh = new THREE.Mesh(geom, frameMat);

      const lensShape = createRoundedRectShape(w - 0.07, h - 0.07, r * 0.8);
      const lensGeom = new THREE.ShapeGeometry(lensShape);
      lensGeom.center();
      lensMesh = new THREE.Mesh(lensGeom, lensMat);

      addNosePad(group, side, frameMat, siliconePadMat);

      const hingeX = side * (separation + 0.52);
      addHingeBlock(group, hingeX, 0.05, frameMat);
      addTempleArm(group, hingeX, 0.05, frameMat, frameMat, 0.024, 0.032);

    } else {
      // 5. SPECTRA CLASSIC WAYFARER / ARTISAN TORTOISE: Iconic Handcrafted Acetate
      const w = 1.02;
      const h = 0.74;
      const r = 0.15;
      const s = createRoundedRectShape(w, h, r);
      const hole = createRoundedRectShape(w - 0.14, h - 0.14, r * 0.8);
      s.holes.push(hole);

      const geom = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.018, bevelThickness: 0.018 });
      geom.center();
      rimMesh = new THREE.Mesh(geom, frameMat);

      // Silver Rivet Accent on outer hinge corner
      const rivetGeom = new THREE.CapsuleGeometry(0.016, 0.04, 6, 8);
      const rivetMesh = new THREE.Mesh(rivetGeom, silverRivetMat);
      rivetMesh.position.set(side * 0.46, 0.24, 0.05);
      rivetMesh.rotation.z = Math.PI / 2;
      rimGroup.add(rivetMesh);

      const lensShape = createRoundedRectShape(w - 0.14, h - 0.14, r * 0.8);
      const lensGeom = new THREE.ShapeGeometry(lensShape);
      lensGeom.center();
      lensMesh = new THREE.Mesh(lensGeom, lensMat);

      const hingeX = side * (separation + 0.54);
      addHingeBlock(group, hingeX, 0.12, frameMat);
      addTempleArm(group, hingeX, 0.12, frameMat, frameMat, 0.038, 0.042);
    }

    if (rimMesh) rimGroup.add(rimMesh);
    if (lensMesh) {
      lensMesh.position.z = 0.01;
      rimGroup.add(lensMesh);
    }
    group.add(rimGroup);
  }

  // Saddle Nose Bridge Connecting the Rims
  const bridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-separation * 0.52, 0.06, 0),
    new THREE.Vector3(0, 0.16, 0.04), // Upward curved arch
    new THREE.Vector3(separation * 0.52, 0.06, 0)
  ]);
  const bridgeRadius = isMetalWire ? 0.024 : 0.042;
  const bridgeGeom = new THREE.TubeGeometry(bridgeCurve, 20, bridgeRadius, 12, false);
  const bridgeMesh = new THREE.Mesh(bridgeGeom, isClubmaster ? goldAccentMat : frameMat);
  group.add(bridgeMesh);

  return group;
}

// Helper: Rounded Rectangle 2D Shape
function createRoundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

// Helper: Realistic Silicone Nose Pad on Gooseneck Wire Post
function addNosePad(group, side, metalMat, padMat) {
  const padArmGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.13, 8);
  const padArmMesh = new THREE.Mesh(padArmGeom, metalMat);
  padArmMesh.position.set(side * 0.19, -0.06, -0.06);
  padArmMesh.rotation.z = side * 0.45;
  padArmMesh.rotation.x = 0.25;
  group.add(padArmMesh);

  const padGeom = new THREE.CapsuleGeometry(0.035, 0.075, 8, 12);
  const padMesh = new THREE.Mesh(padGeom, padMat);
  padMesh.position.set(side * 0.22, -0.11, -0.09);
  padMesh.rotation.z = side * 0.35;
  padMesh.rotation.y = side * 0.25;
  group.add(padMesh);
}

// Helper: Metallic Hinge Block
function addHingeBlock(group, x, y, mat) {
  const hingeGeom = new THREE.CylinderGeometry(0.024, 0.024, 0.08, 12);
  const hingeMesh = new THREE.Mesh(hingeGeom, mat);
  hingeMesh.position.set(x, y, 0);
  group.add(hingeMesh);
}

// Helper: Physical 3D Temple Arm Stretching to Z = -2.5 with Curved Ear Tip
function addTempleArm(group, hingeX, y, stemMat, tipMat, stemRadius, tipRadius) {
  // Part A: Straight-to-tapered Stem
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(hingeX, y, 0),
    new THREE.Vector3(hingeX * 0.99, y + 0.01, -0.8),
    new THREE.Vector3(hingeX * 0.96, y, -1.6)
  ]);
  const stemGeom = new THREE.TubeGeometry(stemCurve, 20, stemRadius, 10, false);
  const stemMesh = new THREE.Mesh(stemGeom, stemMat);
  group.add(stemMesh);

  // Part B: Ergonomic Ear Hook with Acetate Sleeve Tip (matches video 00:00 & 00:05)
  const hookCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(hingeX * 0.96, y, -1.6),
    new THREE.Vector3(hingeX * 0.94, y - 0.04, -2.1),
    new THREE.Vector3(hingeX * 0.92, y - 0.32, -2.5) // Downward ear curve
  ]);
  const hookGeom = new THREE.TubeGeometry(hookCurve, 20, tipRadius, 10, false);
  const hookMesh = new THREE.Mesh(hookGeom, tipMat);
  group.add(hookMesh);
}
