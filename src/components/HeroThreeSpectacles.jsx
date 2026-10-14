import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sparkles } from 'lucide-react';

const CLASSIC_FRAME = {
  id: 'classic-wayfarer',
  name: 'Classic Wayfarer',
  shape: 'wayfarer',
  colorHex: '#18181b',
  frontImage: '/images/eyewear/front_wayfarer.png'
};

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

    // 1. Three.js Scene with Transparent Background
    const scene = new THREE.Scene();

    // 2. Camera setup - Positioned closer and angled to showcase full 3D frame prominently
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 2.75);

    // 3. WebGL Renderer with High-End Tone Mapping & Transparent Canvas
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Smooth 360° Orbital Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
    controls.maxDistance = 4.2;
    controls.minDistance = 1.8;
    controls.maxPolarAngle = Math.PI / 1.75;
    controls.minPolarAngle = Math.PI / 4;
    controls.target.set(0, 0, -0.55);
    controlsRef.current = controls;

    // 5. Studio Lighting Rig - Enhanced for crisp edge highlights and frame visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf0f9ff, 1.8);
    fillLight.position.set(-4, 3, 3);
    scene.add(fillLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 1.6);
    topLight.position.set(0, 5, 0);
    scene.add(topLight);

    const rimLight = new THREE.DirectionalLight(0x00bac6, 1.0);
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);

    // 6. Realistic Soft Contact Shadow Beneath Frame
    const shadowGeom = new THREE.PlaneGeometry(4.6, 2.6);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 40, 0.32)');
    grad.addColorStop(0.5, 'rgba(0, 0, 40, 0.12)');
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
    shadowMesh.position.set(0, -1.05, -0.55);
    scene.add(shadowMesh);

    // 7. Spectacles 3D Assembly Group
    const glassesGroup = new THREE.Group();
    scene.add(glassesGroup);
    glassesGroupRef.current = glassesGroup;

    // Load Authentic Classic Wayfarer Texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      CLASSIC_FRAME.frontImage,
      (texture) => {
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.colorSpace = THREE.SRGBColorSpace;

        const imgW = texture.image?.width || 900;
        const imgH = texture.image?.height || 320;
        const aspect = imgW / imgH;

        // Enlarged frame dimensions for maximum visibility & impact
        const frameHeight = 1.25;
        const frameWidth = frameHeight * aspect;

        buildClassic3DGlasses(glassesGroup, texture, frameWidth, frameHeight);
        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.warn('Fallback glasses rendering:', err);
        buildClassic3DGlasses(glassesGroup, null, 3.1, 1.25);
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
        glassesGroupRef.current.position.y = Math.sin(elapsed * 1.4) * 0.04;
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
      {/* 3D WebGL Canvas Viewport - Spacious, responsive & prominent */}
      <div
        ref={containerRef}
        className="w-full h-[400px] sm:h-[460px] lg:h-[500px] cursor-grab active:cursor-grabbing select-none"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full border border-slate-200 shadow-lg text-xs font-semibold text-slate-700">
            <Sparkles className="w-4 h-4 text-[#00bac6] animate-spin" />
            <span>Rendering 3D Spectacles...</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Builds the prominent Classic Wayfarer 3D Model:
 * - High-resolution front acetate frame
 * - Realistic physical thickness backing
 * - 3D Temple arms traveling backward along -Z with contoured ear hooks
 * - Anti-reflective optical lenses with refractive specular gloss
 */
function buildClassic3DGlasses(group, texture, frameWidth, frameHeight) {
  while (group.children.length > 0) {
    const obj = group.children[0];
    group.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
  }

  const frameColorHex = '#18181b';

  // Front Frame Plane
  const frontGeom = new THREE.PlaneGeometry(frameWidth, frameHeight);
  const frontMat = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.08,
    depthWrite: true,
    roughness: 0.25,
    metalness: 0.12,
    side: THREE.DoubleSide
  });

  // Layer 1: Front face
  const frontMesh = new THREE.Mesh(frontGeom, frontMat);
  group.add(frontMesh);

  // Layer 2: Subtle depth backing for physical rim thickness
  const backMesh = new THREE.Mesh(frontGeom, frontMat);
  backMesh.position.set(0, 0, -0.018);
  group.add(backMesh);

  // 3D Optical Lenses (Crystal Clear with subtle specular reflections)
  const lensWidth = frameWidth * 0.42;
  const lensHeight = frameHeight * 0.82;
  const lensGeom = new THREE.PlaneGeometry(lensWidth, lensHeight, 8, 8);
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xf0f9ff),
    transparent: true,
    opacity: 0.16,
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
    metalness: 0.12,
    roughness: 0.24
  });

  const earTipMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#101012'),
    metalness: 0.1,
    roughness: 0.32
  });

  const hingeX = frameWidth * 0.475;
  const hingeY = frameHeight * 0.12;

  ['left', 'right'].forEach((side) => {
    const isLeft = side === 'left';
    const sign = isLeft ? -1 : 1;

    // Hinge cylinder
    const hingeGeom = new THREE.CylinderGeometry(0.026, 0.026, 0.08, 16);
    const hinge = new THREE.Mesh(hingeGeom, templeMat);
    hinge.position.set(sign * hingeX, hingeY, -0.02);
    group.add(hinge);

    // Main temple shaft traveling backward along -Z
    const shaftLength = 2.25;
    const shaftGeom = new THREE.BoxGeometry(0.028, 0.048, shaftLength);
    const shaft = new THREE.Mesh(shaftGeom, templeMat);
    shaft.position.set(sign * (hingeX - 0.01), hingeY - 0.01, -shaftLength / 2);
    group.add(shaft);

    // Ergonomic downward ear hook curve
    const hookLength = 0.58;
    const hookGeom = new THREE.BoxGeometry(0.028, 0.044, hookLength);
    const hook = new THREE.Mesh(hookGeom, earTipMat);
    hook.position.set(sign * (hingeX - 0.01), hingeY - 0.17, -shaftLength - 0.19);
    hook.rotation.x = 0.55;
    group.add(hook);
  });
}
