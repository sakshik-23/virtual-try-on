import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sparkles } from 'lucide-react';

/**
 * Spectra Optics - Aesthetic 3D Hero Spectacles
 * Features the signature Minimalist Heritage Round Gold frame:
 * - High-definition front rim with polished gold metallic luster
 * - Dual-layer depth for authentic physical wire thickness
 * - Ergonomic 3D gold temple arms with dark tortoiseshell acetate ear tips
 * - Translucent silicone nose pads & sculpted bridge
 * - Ultra-clear optical lenses with subtle anti-reflective blue-light gloss
 * - Soft radial ambient floor shadow with zero clipping
 */
export function HeroThreeSpectacles() {
  const containerRef = useRef(null);
  const controlsRef = useRef(null);
  const glassesGroupRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setIsLoading(true);
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    // 1. Three.js Scene with Soft Studio Lighting
    const scene = new THREE.Scene();

    // 2. Camera setup - Positioned for natural optical showroom perspective (no clipping)
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 4.2);

    // 3. WebGL Renderer with High-End Tone Mapping & Transparent Canvas
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Smooth 360° Orbital Controls with gentle auto-rotation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.8;
    controls.maxDistance = 6.0;
    controls.minDistance = 2.4;
    controls.maxPolarAngle = Math.PI / 1.75;
    controls.minPolarAngle = Math.PI / 4;
    controls.target.set(0, 0, -0.65);
    controlsRef.current = controls;

    // Stop auto-rotate immediately upon user drag
    controls.addEventListener('start', () => {
      controls.autoRotate = false;
    });

    // 5. Studio Lighting Rig - Balanced to highlight gold reflections and glass clarity
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xfefce8, 1.6);
    fillLight.position.set(-4, 3, 3);
    scene.add(fillLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 1.5);
    topLight.position.set(0, 6, 0);
    scene.add(topLight);

    const rimLight = new THREE.DirectionalLight(0xd4af37, 1.2);
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);

    // 6. Seamless Soft Studio Contact Shadow (Radial gradient smoothly fading to 0)
    const shadowGeom = new THREE.PlaneGeometry(3.8, 2.4);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 110);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.22)');
    grad.addColorStop(0.35, 'rgba(15, 23, 42, 0.09)');
    grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.02)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
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
    shadowMesh.position.set(0, -0.78, -0.75);
    scene.add(shadowMesh);

    // 7. Spectacles 3D Assembly Group
    const glassesGroup = new THREE.Group();
    scene.add(glassesGroup);
    glassesGroupRef.current = glassesGroup;

    // Load High-Definition Round Gold Texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/images/eyewear/exact_cutouts/exact_round_gold.png',
      (texture) => {
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.colorSpace = THREE.SRGBColorSpace;

        const imgW = texture.image?.width || 900;
        const imgH = texture.image?.height || 360;
        const aspect = imgW / imgH;

        // Proportioned frame height matching showroom aesthetics
        const frameHeight = 0.98;
        const frameWidth = frameHeight * aspect;

        buildAestheticGoldRoundGlasses(glassesGroup, texture, frameWidth, frameHeight);
        setIsLoading(false);
      },
      undefined,
      () => {
        // Fallback to front_round_gold.png if exact cutout is not reachable
        textureLoader.load(
          '/images/eyewear/front_round_gold.png',
          (fallbackTex) => {
            fallbackTex.colorSpace = THREE.SRGBColorSpace;
            buildAestheticGoldRoundGlasses(glassesGroup, fallbackTex, 2.65, 0.98);
            setIsLoading(false);
          },
          undefined,
          () => {
            buildAestheticGoldRoundGlasses(glassesGroup, null, 2.65, 0.98);
            setIsLoading(false);
          }
        );
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
        glassesGroupRef.current.position.y = Math.sin(elapsed * 1.5) * 0.035;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 600;
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
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-[400px] sm:h-[460px] lg:h-[480px] cursor-grab active:cursor-grabbing select-none"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full border border-slate-200 shadow-lg text-xs font-semibold text-slate-700">
            <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
            <span>Loading 3D Luxury Spectacles...</span>
          </div>
        </div>
      )}

      {/* Minimalist Aesthetic Badge at bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-sm pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-[11px] font-semibold text-slate-600">
          Heritage Round • Polished 24K Gold & Titanium
        </span>
      </div>
    </div>
  );
}

/**
 * Builds the Aesthetic Minimalist Round Gold 3D Spectacles:
 * 1. High-detail front wireframe plane with polished gold metalness
 * 2. 3D double-rim depth at Z = -0.015 for realistic physical wire presence
 * 3. 3D Gold temple arms with dark acetate ear tips traveling backward
 * 4. Translucent silicone nose pads mounted behind the bridge
 * 5. Optical grade lenses with refractive specular gloss
 */
function buildAestheticGoldRoundGlasses(group, texture, frameWidth, frameHeight) {
  while (group.children.length > 0) {
    const obj = group.children[0];
    group.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
  }

  const goldColorHex = '#d4af37';

  // Front Frame Plane
  const frontGeom = new THREE.PlaneGeometry(frameWidth, frameHeight);
  const frontMat = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.08,
    depthWrite: true,
    roughness: 0.22,
    metalness: 0.85,
    side: THREE.DoubleSide
  });

  // Layer 1: Front gold face
  const frontMesh = new THREE.Mesh(frontGeom, frontMat);
  group.add(frontMesh);

  // Layer 2: Subtle depth backing
  const backMesh = new THREE.Mesh(frontGeom, frontMat);
  backMesh.position.set(0, 0, -0.015);
  group.add(backMesh);

  // 3D Optical Lenses (Crystal Clear with subtle blue-light reflection)
  const lensWidth = frameWidth * 0.40;
  const lensHeight = frameHeight * 0.86;
  const lensGeom = new THREE.PlaneGeometry(lensWidth, lensHeight, 8, 8);
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xf0fdfa),
    transparent: true,
    opacity: 0.14,
    roughness: 0.05,
    metalness: 0.08,
    transmission: 0.96,
    ior: 1.52,
    reflectivity: 0.95
  });

  const leftLens = new THREE.Mesh(lensGeom, lensMat);
  leftLens.position.set(-frameWidth * 0.26, 0, -0.005);
  group.add(leftLens);

  const rightLens = new THREE.Mesh(lensGeom, lensMat);
  rightLens.position.set(frameWidth * 0.26, 0, -0.005);
  group.add(rightLens);

  // 3D Gold Temples & Metal Materials
  const templeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(goldColorHex),
    metalness: 0.88,
    roughness: 0.18
  });

  // Tortoiseshell / dark acetate ear tips
  const earTipMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#381e11'),
    metalness: 0.1,
    roughness: 0.35
  });

  // Translucent silicone nose pads
  const padMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xffffff),
    transparent: true,
    opacity: 0.85,
    transmission: 0.7,
    roughness: 0.25,
    ior: 1.45
  });

  // Left & Right Temple Arms
  const hingeX = frameWidth * 0.475;
  const hingeY = frameHeight * 0.08;

  ['left', 'right'].forEach((side) => {
    const isLeft = side === 'left';
    const sign = isLeft ? -1 : 1;

    // Hinge screw cylinder
    const hingeGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.07, 16);
    const hinge = new THREE.Mesh(hingeGeom, templeMat);
    hinge.position.set(sign * hingeX, hingeY, -0.02);
    group.add(hinge);

    // Slim wire temple shaft extending back along -Z
    const shaftLength = 2.15;
    const shaftGeom = new THREE.BoxGeometry(0.02, 0.035, shaftLength);
    const shaft = new THREE.Mesh(shaftGeom, templeMat);
    shaft.position.set(sign * (hingeX - 0.008), hingeY - 0.005, -shaftLength / 2);
    group.add(shaft);

    // Contoured ergonomic ear hook
    const hookLength = 0.54;
    const hookGeom = new THREE.BoxGeometry(0.022, 0.038, hookLength);
    const hook = new THREE.Mesh(hookGeom, earTipMat);
    hook.position.set(sign * (hingeX - 0.008), hingeY - 0.14, -shaftLength - 0.17);
    hook.rotation.x = 0.52;
    group.add(hook);
  });

  // Sculpted Gold Bridge
  const bridgeGeom = new THREE.CylinderGeometry(0.018, 0.018, frameWidth * 0.16, 16);
  const bridge = new THREE.Mesh(bridgeGeom, templeMat);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, frameHeight * 0.12, -0.01);
  group.add(bridge);

  // Silicone Nose Pads behind bridge
  [-1, 1].forEach((sign) => {
    const padGeom = new THREE.BoxGeometry(0.035, 0.12, 0.06);
    const pad = new THREE.Mesh(padGeom, padMat);
    pad.position.set(sign * 0.18, -0.04, -0.08);
    pad.rotation.y = sign * 0.35;
    group.add(pad);
  });
}
