import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sparkles } from 'lucide-react';

/**
 * Spectra Optics - Authentic 3D Showroom Spectacles
 * Features the signature Lumina Round Rose Gold / Gold Minimalist frame:
 * - Natural optical transparency without any cloudy lens artifacts
 * - Ergonomic 3D temple arms curving smoothly along the head
 * - Realistic studio floor shadow with zero clipping
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
    const height = container.clientHeight || 460;

    // 1. Three.js Scene with Pure Studio Lighting
    const scene = new THREE.Scene();

    // 2. Perspective Camera with natural showroom viewing angle
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 4.2);

    // 3. WebGL Renderer with ACESFilmic Tone Mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Free 360° Orbital Controls with gentle auto-rotation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
    controls.maxDistance = 6.2;
    controls.minDistance = 2.2;
    controls.maxPolarAngle = Math.PI / 1.7;
    controls.minPolarAngle = Math.PI / 4;
    controls.target.set(0, 0, -0.65);
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      controls.autoRotate = false;
    });

    // 5. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf8fafc, 1.5);
    fillLight.position.set(-4, 3, 3);
    scene.add(fillLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 1.4);
    topLight.position.set(0, 6, 0);
    scene.add(topLight);

    const rimLight = new THREE.DirectionalLight(0xfff7ed, 1.2);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // 6. Soft Realistic Studio Radial Floor Contact Shadow
    const shadowGeom = new THREE.PlaneGeometry(4.4, 2.8);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.20)');
    grad.addColorStop(0.35, 'rgba(15, 23, 42, 0.07)');
    grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.012)');
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
    shadowMesh.position.set(0, -0.75, -0.8);
    scene.add(shadowMesh);

    // 7. Spectacles 3D Assembly Group
    const glassesGroup = new THREE.Group();
    scene.add(glassesGroup);
    glassesGroupRef.current = glassesGroup;

    // Load Clean Front-Facing Round Gold Texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/images/eyewear/front_round.png',
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const imgW = texture.image?.width || 900;
        const imgH = texture.image?.height || 360;
        const aspect = imgW / imgH;

        const frameHeight = 0.98;
        const frameWidth = frameHeight * aspect;

        buildShowroomRound3DModel(glassesGroup, texture, frameWidth, frameHeight);
        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.warn('Fallback texture loading:', err);
        buildShowroomRound3DModel(glassesGroup, null, 2.6, 0.98);
        setIsLoading(false);
      }
    );

    // 8. Animation Loop with Subtle Organic Float
    let animId = null;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Subtle gentle floating oscillation
      if (glassesGroupRef.current) {
        glassesGroupRef.current.position.y = Math.sin(elapsed * 1.5) * 0.035;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 600;
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
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-[380px] sm:h-[440px] lg:h-[460px] cursor-grab active:cursor-grabbing select-none"
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

    </div>
  );
}

/**
 * Builds the authentic Showroom 3D Eyewear Model:
 * 1. Front Frame: Textured with clean photography, dual-layer depth for realistic physical rim presence.
 * 2. Natural Optical Clarity: PNG transparency is preserved without artificial rectangular lens planes.
 * 3. Seamless 3D Temple Arms: Smooth CatmullRomCurve3 tubes connecting directly to outer hinges and curving over ears.
 * 4. Translucent Silicone Nose Pads: Mounted behind the bridge.
 */
function buildShowroomRound3DModel(group, texture, frameWidth, frameHeight) {
  while (group.children.length > 0) {
    const obj = group.children[0];
    group.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
  }

  const frameColorHex = '#b76e79'; // Elegant Rose Gold

  // Temple Materials
  const templeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(frameColorHex),
    metalness: 0.85,
    roughness: 0.2
  });

  // Ear hook tips: tortoiseshell / dark acetate sleeve
  const earTipMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#381e11'),
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

  // 1. FRONT FRAME MESH
  const frontGeom = new THREE.PlaneGeometry(frameWidth, frameHeight);
  const frontMat = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.08,
    depthWrite: true,
    roughness: 0.28,
    metalness: 0.75,
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

  // 2. PHYSICAL 3D TEMPLE ARMS & HINGES (Smooth curved tubes tucked behind ears)
  const hingeX = (frameWidth / 2) * 0.93;
  const hingeY = frameHeight * 0.08;

  const stemRadius = 0.016;
  const hookRadius = 0.022;

  for (let side of [-1, 1]) {
    const x = side * hingeX;

    // Metallic Hinge Barrel
    const hingeGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.05, 12);
    const hingeMesh = new THREE.Mesh(hingeGeom, templeMat);
    hingeMesh.position.set(x, hingeY, -0.015);
    group.add(hingeMesh);

    // Part A: Front Temple Stem (traveling straight back along -Z to Z = -1.6)
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, hingeY, -0.02),
      new THREE.Vector3(x * 0.94, hingeY, -0.8),
      new THREE.Vector3(x * 0.88, hingeY - 0.01, -1.6)
    ]);
    const stemGeom = new THREE.TubeGeometry(stemCurve, 24, stemRadius, 10, false);
    const stemMesh = new THREE.Mesh(stemGeom, templeMat);
    group.add(stemMesh);

    // Part B: Ergonomic Ear Hook (curving down to Z = -2.45)
    const hookCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x * 0.88, hingeY - 0.01, -1.6),
      new THREE.Vector3(x * 0.85, hingeY - 0.08, -2.05),
      new THREE.Vector3(x * 0.82, hingeY - 0.38, -2.45)
    ]);
    const hookGeom = new THREE.TubeGeometry(hookCurve, 20, hookRadius, 10, false);
    const hookMesh = new THREE.Mesh(hookGeom, earTipMat);
    group.add(hookMesh);

    // Silicone Nose Pads behind bridge
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
