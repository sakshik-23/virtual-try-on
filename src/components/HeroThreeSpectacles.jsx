import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RotateCw, Sparkles, Layers, Eye } from 'lucide-react';

const PRESET_FRAMES = [
  {
    id: 'wayfarer',
    name: 'Classic Wayfarer',
    shape: 'wayfarer',
    brand: 'Spectra Signature',
    colorHex: '#1c1c1e',
    frontImage: '/images/eyewear/front_wayfarer.png',
    tag: 'Best Seller'
  },
  {
    id: 'aviator',
    name: 'Aviator Titanium Gold',
    shape: 'aviator',
    brand: 'Spectra Air',
    colorHex: '#d4af37',
    frontImage: '/images/eyewear/front_aviator.png',
    tag: 'Ultra-Light'
  },
  {
    id: 'round',
    name: 'Minimalist Round Gold',
    shape: 'round',
    brand: 'Heritage Optics',
    colorHex: '#b76e79',
    frontImage: '/images/eyewear/front_round_gold.png',
    tag: 'Vintage Luxe'
  },
  {
    id: 'clubmaster',
    name: 'Classic Browline',
    shape: 'wayfarer',
    brand: 'Retro Elegance',
    colorHex: '#27272a',
    frontImage: '/images/eyewear/front_clubmaster.png',
    tag: 'Iconic Fit'
  }
];

export function HeroThreeSpectacles({ onExploreFrames, onLaunchTryOn }) {
  const containerRef = useRef(null);
  const controlsRef = useRef(null);
  const glassesGroupRef = useRef(null);
  const [selectedFrame, setSelectedFrame] = useState(PRESET_FRAMES[0]);
  const [isRotating, setIsRotating] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setIsLoading(true);
    const width = container.clientWidth || 560;
    const height = container.clientHeight || 420;

    // 1. Three.js Scene with Transparent Background
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 3.8);

    // 3. WebGL Renderer with High-End Tone Mapping & Transparent Canvas
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls with Smooth Damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = isRotating;
    controls.autoRotateSpeed = 2.4;
    controls.maxDistance = 5.5;
    controls.minDistance = 2.2;
    controls.maxPolarAngle = Math.PI / 1.7; // Prevent looking too far underneath
    controls.minPolarAngle = Math.PI / 4;   // Prevent looking directly top-down
    controls.target.set(0, 0, -0.6);
    controlsRef.current = controls;

    // Stop auto-rotation when user manually interacts
    controls.addEventListener('start', () => {
      setIsRotating(false);
      controls.autoRotate = false;
    });

    // 5. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf0f9ff, 1.5);
    fillLight.position.set(-4, 3, 3);
    scene.add(fillLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 1.4);
    topLight.position.set(0, 5, 0);
    scene.add(topLight);

    const rimLight = new THREE.DirectionalLight(0x00bac6, 0.8);
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);

    // 6. Soft Studio Contact Shadow
    const shadowGeom = new THREE.PlaneGeometry(4.2, 2.4);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 40, 0.28)');
    grad.addColorStop(0.5, 'rgba(0, 0, 40, 0.10)');
    grad.addColorStop(1, 'rgba(0, 0, 40, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -0.92, -0.6);
    scene.add(shadowMesh);

    // 7. Spectacles 3D Assembly Group
    const glassesGroup = new THREE.Group();
    scene.add(glassesGroup);
    glassesGroupRef.current = glassesGroup;

    // Load Frame Texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      selectedFrame.frontImage,
      (texture) => {
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.colorSpace = THREE.SRGBColorSpace;

        const imgW = texture.image?.width || 900;
        const imgH = texture.image?.height || 320;
        const aspect = imgW / imgH;

        const frameHeight = 1.0;
        const frameWidth = frameHeight * aspect;

        buildAuthentic3DGlasses(glassesGroup, selectedFrame, texture, frameWidth, frameHeight);
        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.warn('Fallback glasses rendering:', err);
        buildAuthentic3DGlasses(glassesGroup, selectedFrame, null, 2.6, 1.0);
        setIsLoading(false);
      }
    );

    // 8. Animation Loop with Subtle Organic Float
    let animId = null;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Gentle floating oscillation
      if (glassesGroupRef.current) {
        glassesGroupRef.current.position.y = Math.sin(elapsed * 1.5) * 0.04;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 560;
      const h = container.clientHeight || 420;
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
  }, [selectedFrame]);

  // Handle Toggle Auto-Rotate
  const handleToggleRotate = () => {
    if (controlsRef.current) {
      const nextState = !isRotating;
      setIsRotating(nextState);
      controlsRef.current.autoRotate = nextState;
    }
  };

  // Reset Camera View
  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 0, -0.6);
      setIsRotating(true);
      controlsRef.current.autoRotate = true;
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-[380px] sm:h-[440px] lg:h-[480px] cursor-grab active:cursor-grabbing select-none"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full border border-slate-200 shadow-lg text-xs font-semibold text-slate-700">
            <Sparkles className="w-4 h-4 text-[#00bac6] animate-spin" />
            <span>Generating 3D Spectacles...</span>
          </div>
        </div>
      )}

      {/* Floating HUD Badges around the 3D Spectacles */}
      {/* Top Left Badge */}
      <div className="hidden sm:flex absolute top-4 left-4 lg:left-8 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-md items-center gap-2.5 text-left pointer-events-none animate-in fade-in slide-in-from-left duration-300">
        <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#000042] flex items-center justify-center font-bold text-xs">
          3D
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
            Three.js Engine
          </span>
          <span className="text-xs font-bold text-slate-800">
            Real-Time PBR Shading
          </span>
        </div>
      </div>

      {/* Top Right Badge */}
      <div className="hidden sm:flex absolute top-4 right-4 lg:right-8 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-md items-center gap-2.5 text-left pointer-events-none animate-in fade-in slide-in-from-right duration-300">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
          1:1
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
            True Scale
          </span>
          <span className="text-xs font-bold text-slate-800">
            Millimeter Fit Accuracy
          </span>
        </div>
      </div>

      {/* Bottom Center Interaction Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-xl z-20">
        <button
          onClick={handleToggleRotate}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
            isRotating
              ? 'bg-[#000042] text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Toggle 360 Auto-Rotation"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
          <span>{isRotating ? 'Rotating 360°' : 'Rotate'}</span>
        </button>

        <button
          onClick={handleReset}
          className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          title="Reset View"
        >
          Reset View
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
          Drag to inspect from any angle
        </span>
      </div>

      {/* Frame Switcher Bar Under Canvas */}
      <div className="w-full max-w-md mt-2 flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-50/90 rounded-2xl border border-slate-200/80">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
          Select 3D Model:
        </span>
        {PRESET_FRAMES.map((frame) => {
          const isSelected = selectedFrame.id === frame.id;
          return (
            <button
              key={frame.id}
              onClick={() => setSelectedFrame(frame)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white text-[#000042] shadow-sm border border-slate-200 ring-2 ring-[#00bac6]/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {frame.name.split(' ')[0]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Builds the authentic 3D spectacles mesh with:
 * - Front frame textured with photographic cutout
 * - Dual-layer depth for realistic rim thickness
 * - Real 3D temple arms extending backward with ear hooks
 * - Silicone nose pads and metal bridge
 * - Specular optical lenses
 */
function buildAuthentic3DGlasses(group, frameData, texture, frameWidth, frameHeight) {
  // Clear previous children
  while (group.children.length > 0) {
    const obj = group.children[0];
    group.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
  }

  const isAviator = frameData.shape === 'aviator';
  const isMetal = frameData.shape === 'round' || isAviator;
  const frameColorHex = frameData.colorHex || '#1c1c1e';

  // Front Frame Plane
  const frontGeom = new THREE.PlaneGeometry(frameWidth, frameHeight);
  const frontMat = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.08,
    depthWrite: true,
    roughness: isMetal ? 0.28 : 0.32,
    metalness: isMetal ? 0.75 : 0.08,
    side: THREE.DoubleSide
  });

  // Layer 1: Front face
  const frontMesh = new THREE.Mesh(frontGeom, frontMat);
  group.add(frontMesh);

  // Layer 2: Subtle depth backing
  const backMesh = new THREE.Mesh(frontGeom, frontMat);
  backMesh.position.set(0, 0, -0.015);
  group.add(backMesh);

  // 3D Optical Lenses (Crystal Clear with subtle refractive specular reflections)
  const lensWidth = (frameWidth * 0.42);
  const lensHeight = (frameHeight * 0.82);
  const lensGeom = new THREE.PlaneGeometry(lensWidth, lensHeight, 8, 8);
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xf0f9ff),
    transparent: true,
    opacity: 0.18,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.95,
    ior: 1.52,
    reflectivity: 0.9
  });

  const leftLens = new THREE.Mesh(lensGeom, lensMat);
  leftLens.position.set(-frameWidth * 0.26, 0, -0.005);
  group.add(leftLens);

  const rightLens = new THREE.Mesh(lensGeom, lensMat);
  rightLens.position.set(frameWidth * 0.26, 0, -0.005);
  group.add(rightLens);

  // 3D Temple Arms (Left & Right extending along -Z)
  const templeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(frameColorHex),
    metalness: isMetal ? 0.85 : 0.12,
    roughness: isMetal ? 0.2 : 0.28
  });

  const earTipMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(isMetal ? '#18181b' : frameColorHex),
    metalness: 0.1,
    roughness: 0.35
  });

  const hingeX = frameWidth * 0.475;
  const hingeY = frameHeight * 0.12;

  ['left', 'right'].forEach((side) => {
    const isLeft = side === 'left';
    const sign = isLeft ? -1 : 1;

    // Hinge cylinder
    const hingeGeom = new THREE.CylinderGeometry(0.024, 0.024, 0.08, 16);
    const hinge = new THREE.Mesh(hingeGeom, templeMat);
    hinge.position.set(sign * hingeX, hingeY, -0.02);
    group.add(hinge);

    // Main temple shaft traveling backward along -Z
    const shaftLength = 2.15;
    const shaftGeom = new THREE.BoxGeometry(0.025, 0.045, shaftLength);
    const shaft = new THREE.Mesh(shaftGeom, templeMat);
    shaft.position.set(sign * (hingeX - 0.01), hingeY - 0.01, -shaftLength / 2);
    group.add(shaft);

    // Ergonomic downward ear hook curve
    const hookLength = 0.55;
    const hookGeom = new THREE.BoxGeometry(0.025, 0.042, hookLength);
    const hook = new THREE.Mesh(hookGeom, earTipMat);
    hook.position.set(sign * (hingeX - 0.01), hingeY - 0.16, -shaftLength - 0.18);
    hook.rotation.x = 0.55; // Angle downward over the ear
    group.add(hook);
  });

  // Nose Bridge for metal / aviators
  if (isMetal) {
    const bridgeGeom = new THREE.CylinderGeometry(0.015, 0.015, frameWidth * 0.18, 12);
    const bridgeMesh = new THREE.Mesh(bridgeGeom, templeMat);
    bridgeMesh.rotation.z = Math.PI / 2;
    bridgeMesh.position.set(0, frameHeight * 0.15, -0.01);
    group.add(bridgeMesh);
  }
}
