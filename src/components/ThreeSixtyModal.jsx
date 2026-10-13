import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { X, Sparkles, RotateCw, ZoomIn, ZoomOut, Compass } from 'lucide-react';

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
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 460;

    // 1. Crisp Luxury White Studio Scene (Matches Reference Video!)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // 2. Camera setup - Positioned to capture full 3D glasses with depth
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 4.3);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. OrbitControls: Free 360° Rotation in ALL Directions (Matches Video 00:00 to 00:10!)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
    controls.maxDistance = 6.5;
    controls.minDistance = 2.0;
    controls.target.set(0, 0, -0.6); // Center of glasses between rims and ear hooks
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      setHasInteracted(true);
      controls.autoRotate = false; // Stop auto rotate once user interacts
    });

    // 5. Studio Lighting Rig for Realistic Metallic Highlights & Glass Specularity
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf1f5f9, 1.2);
    fillLight.position.set(-4, 2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // 6. Soft Realistic Radial Floor Shadow (Exact Match to Video!)
    const shadowGeom = new THREE.PlaneGeometry(4.2, 2.6);
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

    // 7. BUILD HIGH-FIDELITY 3D EYEWEAR MODEL (Exact Match to Video!)
    const frameColorHex = activeColor?.hex || '#d4af37';
    const isWireframeMetal = product.shape === 'round' || activeColor?.metalness > 0.5;

    const frameMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(frameColorHex),
      metalness: activeColor?.metalness ?? (isWireframeMetal ? 0.9 : 0.2),
      roughness: activeColor?.roughness ?? (isWireframeMetal ? 0.2 : 0.35)
    });

    const lensMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(product.defaultLensHex || '#f0f9ff'),
      transparent: true,
      opacity: 0.25,
      roughness: 0.02,
      metalness: 0.08,
      transmission: 0.94,
      ior: 1.52,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03
    });

    const templeTipMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(isWireframeMetal ? '#18181b' : frameColorHex), // Black acetate tips on gold metal stems (exact match to video!)
      metalness: 0.1,
      roughness: 0.4
    });

    const siliconePadMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 0.75,
      transmission: 0.85,
      roughness: 0.2,
      ior: 1.45
    });

    const glassesGroup = buildLuxury3DModel(product, frameMat, lensMat, templeTipMat, siliconePadMat);
    scene.add(glassesGroup);

    // 8. Animation Loop
    let animId = null;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 460;
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

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header - Clean & Minimalist (Matching Reference Video) */}
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
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D Canvas Viewport (Free 360° Drag & Orbit in All Directions!) */}
        <div className="relative w-full h-[400px] sm:h-[460px] bg-white cursor-grab active:cursor-grabbing select-none">
          <div ref={containerRef} className="w-full h-full" />

          {/* Interactive Hint Indicator */}
          {!hasInteracted && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-transparent z-10">
              <div className="flex flex-col items-center gap-1.5 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border border-slate-200 text-xs font-semibold text-slate-700 animate-bounce">
                <span className="text-lg">👆</span>
                <span>Click & drag to rotate 360° in any direction</span>
              </div>
            </div>
          )}

          {/* Quick 360 Badge */}
          <div className="absolute bottom-4 left-6 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 text-xs font-semibold text-slate-700 border border-slate-200 shadow-sm z-10">
            <RotateCw className="w-3.5 h-3.5 text-[#000042] animate-spin" style={{ animationDuration: '6s' }} />
            <span>360° Full Orbital 3D View</span>
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

/**
 * Builds a Photorealistic 3D Eyewear Model
 * Replicating the exact geometric round wireframe with black temple tips shown in the user's reference video!
 */
function buildLuxury3DModel(product, frameMat, lensMat, templeTipMat, siliconePadMat) {
  const group = new THREE.Group();
  const shape = product.shape || 'wayfarer';

  const separation = 0.72; // Bridge center to pupil center distance
  const isWire = shape === 'round';
  const rimWireRadius = isWire ? 0.022 : 0.045; // Slender luxury wireframe like in the video

  for (let side of [-1, 1]) {
    const rimGroup = new THREE.Group();
    rimGroup.position.x = side * separation;

    let rimMesh, lensMesh;

    if (shape === 'round') {
      // 1. Geometric Panto Round / Hexagonal Arch (Exact match to reference video 00:00 - 00:10!)
      // Rounded at bottom with gentle top brow arch
      const curve = new THREE.CurvePath();
      const R = 0.54;
      const pts = [];
      const numSegments = 32;
      for (let i = 0; i <= numSegments; i++) {
        const theta = (i / numSegments) * Math.PI * 2;
        // Panto shape: slightly flattened top arch
        let r = R;
        if (Math.sin(theta) > 0.3) {
          r *= 0.94; // Flattened top
        }
        pts.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, 0));
      }
      const roundSpline = new THREE.CatmullRomCurve3(pts, true);
      const rimGeom = new THREE.TubeGeometry(roundSpline, 48, rimWireRadius, 12, true);
      rimMesh = new THREE.Mesh(rimGeom, frameMat);

      const lensGeom = new THREE.CircleGeometry(R - 0.015, 32);
      lensMesh = new THREE.Mesh(lensGeom, lensMat);
    } else if (shape === 'cat-eye') {
      // 2. Winged Cat-Eye Silhouette
      const pts = [];
      const flare = side * 0.22;
      const s = new THREE.Shape();
      s.moveTo(-0.4, -0.3);
      s.lineTo(0.4, -0.3);
      s.bezierCurveTo(0.6 + flare, 0, 0.7 + flare, 0.55, 0, 0.42);
      s.bezierCurveTo(-0.6, 0.42, -0.5, 0, -0.4, -0.3);

      const extrudeSettings = { depth: 0.06, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.015, bevelThickness: 0.015 };
      const geom = new THREE.ExtrudeGeometry(s, extrudeSettings);
      geom.center();
      rimMesh = new THREE.Mesh(geom, frameMat);

      const lensGeom = new THREE.ShapeGeometry(s);
      lensGeom.center();
      lensMesh = new THREE.Mesh(lensGeom, lensMat);
    } else if (shape === 'rectangle') {
      // 3. Executive Rounded Rectangle
      const w = 0.95;
      const h = 0.62;
      const r = 0.12;
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

      const hole = new THREE.Path();
      const hw = w - 0.08;
      const hh = h - 0.08;
      hole.moveTo(-hw / 2 + r, -hh / 2);
      hole.lineTo(hw / 2 - r, -hh / 2);
      hole.quadraticCurveTo(hw / 2, -hh / 2, hw / 2, -hh / 2 + r);
      hole.lineTo(hw / 2, hh / 2 - r);
      hole.quadraticCurveTo(hw / 2, hh / 2, hw / 2 - r, hh / 2);
      hole.lineTo(-hw / 2 + r, hh / 2);
      hole.quadraticCurveTo(-hw / 2, hh / 2, -hw / 2, hh / 2 - r);
      hole.lineTo(-hw / 2, -hh / 2 + r);
      hole.quadraticCurveTo(-hw / 2, -hh / 2, -hw / 2 + r, -hh / 2);
      s.holes.push(hole);

      const geom = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.012, bevelThickness: 0.012 });
      geom.center();
      rimMesh = new THREE.Mesh(geom, frameMat);

      const lensShape = new THREE.Shape();
      lensShape.moveTo(-hw / 2 + r, -hh / 2);
      lensShape.lineTo(hw / 2 - r, -hh / 2);
      lensShape.quadraticCurveTo(hw / 2, -hh / 2, hw / 2, -hh / 2 + r);
      lensShape.lineTo(hw / 2, hh / 2 - r);
      lensShape.quadraticCurveTo(hw / 2, hh / 2, hw / 2 - r, hh / 2);
      lensShape.lineTo(-hw / 2 + r, hh / 2);
      lensShape.quadraticCurveTo(-hw / 2, hh / 2, -hw / 2, hh / 2 - r);
      lensShape.lineTo(-hw / 2, -hh / 2 + r);
      lensShape.quadraticCurveTo(-hw / 2, -hh / 2, -hw / 2 + r, -hh / 2);
      const lensGeom = new THREE.ShapeGeometry(lensShape);
      lensGeom.center();
      lensMesh = new THREE.Mesh(lensGeom, lensMat);
    } else {
      // 4. Classic Wayfarer / Clubmaster Acetate
      const w = 1.0;
      const h = 0.75;
      const r = 0.16;
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

      const hole = new THREE.Path();
      const hw = w - 0.12;
      const hh = h - 0.12;
      hole.moveTo(-hw / 2 + r, -hh / 2);
      hole.lineTo(hw / 2 - r, -hh / 2);
      hole.quadraticCurveTo(hw / 2, -hh / 2, hw / 2, -hh / 2 + r);
      hole.lineTo(hw / 2, hh / 2 - r);
      hole.quadraticCurveTo(hw / 2, hh / 2, hw / 2 - r, hh / 2);
      hole.lineTo(-hw / 2 + r, hh / 2);
      hole.quadraticCurveTo(-hw / 2, hh / 2, -hw / 2, hh / 2 - r);
      hole.lineTo(-hw / 2, -hh / 2 + r);
      hole.quadraticCurveTo(-hw / 2, -hh / 2, -hw / 2 + r, -hh / 2);
      s.holes.push(hole);

      const geom = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.018, bevelThickness: 0.018 });
      geom.center();
      rimMesh = new THREE.Mesh(geom, frameMat);

      const lensShape = new THREE.Shape();
      lensShape.moveTo(-hw / 2 + r, -hh / 2);
      lensShape.lineTo(hw / 2 - r, -hh / 2);
      lensShape.quadraticCurveTo(hw / 2, -hh / 2, hw / 2, -hh / 2 + r);
      lensShape.lineTo(hw / 2, hh / 2 - r);
      lensShape.quadraticCurveTo(hw / 2, hh / 2, hw / 2 - r, hh / 2);
      lensShape.lineTo(-hw / 2 + r, hh / 2);
      lensShape.quadraticCurveTo(-hw / 2, hh / 2, -hw / 2, hh / 2 - r);
      lensShape.lineTo(-hw / 2, -hh / 2 + r);
      lensShape.quadraticCurveTo(-hw / 2, -hh / 2, -hw / 2 + r, -hh / 2);
      const lensGeom = new THREE.ShapeGeometry(lensShape);
      lensGeom.center();
      lensMesh = new THREE.Mesh(lensGeom, lensMat);
    }

    lensMesh.position.z = 0.01;
    rimGroup.add(rimMesh);
    rimGroup.add(lensMesh);
    group.add(rimGroup);

    // 2. Realistic Silicone Nose Pads (Visible from inside/back view 00:05!)
    const padArmGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8);
    const padArmMesh = new THREE.Mesh(padArmGeom, frameMat);
    padArmMesh.position.set(side * 0.18, -0.06, -0.06);
    padArmMesh.rotation.z = side * 0.45;
    padArmMesh.rotation.x = 0.25;
    group.add(padArmMesh);

    const padGeom = new THREE.CapsuleGeometry(0.035, 0.07, 8, 12);
    const padMesh = new THREE.Mesh(padGeom, siliconePadMat);
    padMesh.position.set(side * 0.21, -0.11, -0.09);
    padMesh.rotation.z = side * 0.35;
    padMesh.rotation.y = side * 0.25;
    group.add(padMesh);

    // 3. Metallic Hinge Block at Rim Outer Corner
    const hingeGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.08, 12);
    const hingeMesh = new THREE.Mesh(hingeGeom, frameMat);
    const hingeX = side * (separation + 0.52);
    hingeMesh.position.set(hingeX, 0.08, 0);
    group.add(hingeMesh);

    // 4. Physical 3D Temple Arms Stretching Back to Z = -2.5 (Exact Match to Reference Video 00:00 & 00:05!)
    // Part A: Front 65% metallic/acetate stem
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(hingeX, 0.08, 0),
      new THREE.Vector3(hingeX * 0.99, 0.09, -0.8),
      new THREE.Vector3(hingeX * 0.96, 0.08, -1.6)
    ]);
    const stemRadius = isWire ? 0.02 : 0.035;
    const stemGeom = new THREE.TubeGeometry(stemCurve, 20, stemRadius, 10, false);
    const stemMesh = new THREE.Mesh(stemGeom, frameMat);
    group.add(stemMesh);

    // Part B: Ergonomic Ear Hook with Contrasting Black Acetate Tip (Exact match to 00:00 in video!)
    const hookCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(hingeX * 0.96, 0.08, -1.6),
      new THREE.Vector3(hingeX * 0.94, 0.04, -2.1),
      new THREE.Vector3(hingeX * 0.92, -0.26, -2.5) // Downward ear curve
    ]);
    const hookRadius = isWire ? 0.032 : 0.042; // Acetate temple sleeve tip
    const hookGeom = new THREE.TubeGeometry(hookCurve, 20, hookRadius, 10, false);
    const hookMesh = new THREE.Mesh(hookGeom, templeTipMat);
    group.add(hookMesh);
  }

  // 5. Arched Nose Bridge Connecting the Rims
  const bridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-separation * 0.55, 0.06, 0),
    new THREE.Vector3(0, 0.16, 0.04), // Upward curved saddle arch
    new THREE.Vector3(separation * 0.55, 0.06, 0)
  ]);
  const bridgeGeom = new THREE.TubeGeometry(bridgeCurve, 20, isWire ? 0.022 : 0.038, 12, false);
  const bridgeMesh = new THREE.Mesh(bridgeGeom, frameMat);
  group.add(bridgeMesh);

  return group;
}
