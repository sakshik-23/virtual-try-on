import * as THREE from 'three';

/**
 * THREE.JS GLASSES & AR ENGINE
 * Optimized for 60 FPS with ZERO allocations in the render loop.
 * Includes Head Occluder mask so temple arms disappear naturally behind ears.
 */

// PRE-ALLOCATED MATH CACHE (Zero Garbage Collection in requestAnimationFrame)
const _nosePos = new THREE.Vector3();
const _leftTemple = new THREE.Vector3();
const _rightTemple = new THREE.Vector3();
const _forehead = new THREE.Vector3();
const _chin = new THREE.Vector3();
const _eyeVec = new THREE.Vector3();
const _faceVerticalVec = new THREE.Vector3();
const _faceNormalVec = new THREE.Vector3();
const _headCenter = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _targetScale = new THREE.Vector3();
const _targetEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const _targetQuat = new THREE.Quaternion();

export class ThreeGlassesEngine {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Anchor hierarchy
    this.glassesAnchor = null;
    this.headOccluder = null;
    this.currentGlassesMesh = null;

    // Material caches
    this.frameMaterial = null;
    this.lensMaterial = null;
    this.metalAccentMaterial = null;

    // Smoothing filters (exponential smoothing for jitter-free AR tracking)
    this.smoothedPos = new THREE.Vector3();
    this.smoothedScale = new THREE.Vector3(1, 1, 1);
    this.smoothedQuat = new THREE.Quaternion();
    this.hasInitialPose = false;
    this.lerpFactor = 0.55; // 0 = freeze, 1 = instant snap. 0.55 = buttery smooth

    this.currentStyle = 'wayfarer';
    this.currentColor = { hex: '#1c1c1e', metalness: 0.1, roughness: 0.6 };
    this.currentLens = { hex: '#cffafe', opacity: 0.2, roughness: 0.05 };

    this.init();
  }

  init() {
    const width = this.canvas.clientWidth || 640;
    const height = this.canvas.clientHeight || 480;

    // 1. Scene setup
    this.scene = new THREE.Scene();

    // 2. Camera: Match typical 60° FOV webcam projection
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer with alpha: true to composite directly on top of mirrored webcam
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      console.warn("Primary WebGL initialization failed, attempting fallback...", e);
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: false
      });
    }
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // 4. Studio Lighting Pipeline for realistic metallic & acetate reflections
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(2, 4, 5);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.8);
    fillLight.position.set(-3, 1, 4);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfff7ed, 0.6);
    rimLight.position.set(0, -3, 3);
    this.scene.add(rimLight);

    // 5. Glasses Anchor Group
    this.glassesAnchor = new THREE.Group();
    this.glassesAnchor.visible = false;
    this.scene.add(this.glassesAnchor);

    // 6. Realistic Head Occluder (ColorWrite: false, DepthWrite: true)
    // Temple arms passing behind ears are automatically masked out!
    this.setupHeadOccluder();

    // 7. Base Materials
    this.initMaterials();

    // 8. Build initial glasses geometry
    this.buildGlassesModel(this.currentStyle);
  }

  setupHeadOccluder() {
    // Custom occluder geometry representing head volume behind face plane
    const headGeom = new THREE.SphereGeometry(1.6, 24, 24);
    headGeom.scale(1.0, 1.3, 1.2); // Head proportions

    const occluderMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      colorWrite: false, // DO NOT draw pixels
      depthWrite: true   // DO populate depth buffer
    });

    this.headOccluder = new THREE.Mesh(headGeom, occluderMat);
    this.headOccluder.renderOrder = 0; // Render first into depth buffer
    this.headOccluder.position.set(0, -0.2, -1.3); // Offset slightly behind nose bridge
    this.headOccluder.visible = false;
    this.scene.add(this.headOccluder);
  }

  initMaterials() {
    this.frameMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.currentColor.hex),
      metalness: this.currentColor.metalness,
      roughness: this.currentColor.roughness,
    });

    this.metalAccentMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#d4af37'),
      metalness: 0.9,
      roughness: 0.2
    });

    this.lensMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(this.currentLens.hex),
      transparent: true,
      opacity: this.currentLens.opacity,
      roughness: this.currentLens.roughness,
      metalness: 0.1,
      transmission: 0.9,
      ior: 1.52, // Optical glass index of refraction
      reflectivity: 0.7,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    });
  }

  /**
   * Builds high-fidelity procedural 3D eyewear model
   */
  buildGlassesModel(style = 'wayfarer') {
    if (this.currentGlassesMesh) {
      this.glassesAnchor.remove(this.currentGlassesMesh);
      this.disposeObject(this.currentGlassesMesh);
    }

    const group = new THREE.Group();
    group.renderOrder = 1; // Render after occluder

    const rimRadiusX = style === 'aviator' ? 0.65 : style === 'round' ? 0.55 : style === 'hexagonal' ? 0.58 : style === 'cat-eye' ? 0.62 : 0.6;
    const rimRadiusY = style === 'aviator' ? 0.68 : style === 'round' ? 0.55 : style === 'cat-eye' ? 0.52 : style === 'rectangle' ? 0.42 : 0.52;
    const rimThickness = style === 'round' || style === 'hexagonal' ? 0.035 : 0.06;
    const separation = 0.75; // Distance from center to each eye

    // Left and Right Rims & Lenses
    for (let side of [-1, 1]) {
      const rimGroup = new THREE.Group();
      rimGroup.position.x = side * separation;

      let rimMesh, lensMesh;

      if (style === 'round') {
        const torusGeom = new THREE.TorusGeometry(rimRadiusX, rimThickness, 16, 48);
        rimMesh = new THREE.Mesh(torusGeom, this.frameMaterial);
        const lensGeom = new THREE.CircleGeometry(rimRadiusX - rimThickness * 0.5, 36);
        lensMesh = new THREE.Mesh(lensGeom, this.lensMaterial);
      } else if (style === 'hexagonal') {
        const hexGeom = new THREE.TorusGeometry(rimRadiusX, rimThickness, 16, 6);
        hexGeom.rotateZ(Math.PI / 6);
        rimMesh = new THREE.Mesh(hexGeom, this.frameMaterial);
        const lensGeom = new THREE.CircleGeometry(rimRadiusX - rimThickness * 0.5, 6);
        lensGeom.rotateZ(Math.PI / 6);
        lensMesh = new THREE.Mesh(lensGeom, this.lensMaterial);
      } else if (style === 'aviator') {
        // Teardrop shape
        const shape = new THREE.Shape();
        const rx = rimRadiusX;
        const ry = rimRadiusY;
        shape.moveTo(0, ry * 0.8);
        shape.bezierCurveTo(rx * 0.9, ry * 0.8, rx * 1.05, -ry * 0.5, 0, -ry * 0.95);
        shape.bezierCurveTo(-rx * 1.05, -ry * 0.5, -rx * 0.9, ry * 0.8, 0, ry * 0.8);

        const extrudeSettings = { depth: 0.06, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geom.center();
        rimMesh = new THREE.Mesh(geom, this.frameMaterial);

        const lensGeom = new THREE.ShapeGeometry(shape);
        lensGeom.center();
        lensMesh = new THREE.Mesh(lensGeom, this.lensMaterial);
      } else if (style === 'cat-eye') {
        // Winged shape
        const shape = new THREE.Shape();
        const rx = rimRadiusX;
        const ry = rimRadiusY;
        const flare = side * 0.25;
        shape.moveTo(-rx * 0.7, -ry * 0.6);
        shape.lineTo(rx * 0.7, -ry * 0.6);
        shape.bezierCurveTo(rx * 0.9 + flare, 0, rx + flare * 1.3, ry * 0.9, 0, ry * 0.7);
        shape.bezierCurveTo(-rx * 0.8, ry * 0.7, -rx * 0.8, 0, -rx * 0.7, -ry * 0.6);

        const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geom.center();
        rimMesh = new THREE.Mesh(geom, this.frameMaterial);

        const lensGeom = new THREE.ShapeGeometry(shape);
        lensGeom.center();
        lensMesh = new THREE.Mesh(lensGeom, this.lensMaterial);
      } else {
        // Classic Wayfarer / Rectangle
        const w = rimRadiusX * 1.8;
        const h = rimRadiusY * 1.7;
        const shape = new THREE.Shape();
        const r = 0.15;
        shape.moveTo(-w / 2 + r, -h / 2);
        shape.lineTo(w / 2 - r, -h / 2);
        shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
        shape.lineTo(w / 2, h / 2 - r);
        shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
        shape.lineTo(-w / 2 + r, h / 2);
        shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
        shape.lineTo(-w / 2, -h / 2 + r);
        shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

        // Cut hole for lens in rim
        const hole = new THREE.Path();
        const hr = 0.1;
        const hw = w - rimThickness * 2.5;
        const hh = h - rimThickness * 2.5;
        hole.moveTo(-hw / 2 + hr, -hh / 2);
        hole.lineTo(hw / 2 - hr, -hh / 2);
        hole.quadraticCurveTo(hw / 2, -hh / 2, hw / 2, -hh / 2 + hr);
        hole.lineTo(hw / 2, hh / 2 - hr);
        hole.quadraticCurveTo(hw / 2, hh / 2, hw / 2 - hr, hh / 2);
        hole.lineTo(-hw / 2 + hr, hh / 2);
        hole.quadraticCurveTo(-hw / 2, hh / 2, -hw / 2, hh / 2 - hr);
        hole.lineTo(-hw / 2, -hh / 2 + hr);
        hole.quadraticCurveTo(-hw / 2, -hh / 2, -hw / 2 + hr, -hh / 2);
        shape.holes.push(hole);

        const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geom.center();
        rimMesh = new THREE.Mesh(geom, this.frameMaterial);

        const lensShape = new THREE.Shape();
        lensShape.moveTo(-hw / 2 + hr, -hh / 2);
        lensShape.lineTo(hw / 2 - hr, -hh / 2);
        lensShape.quadraticCurveTo(hw / 2, -hh / 2, hw / 2, -hh / 2 + hr);
        lensShape.lineTo(hw / 2, hh / 2 - hr);
        lensShape.quadraticCurveTo(hw / 2, hh / 2, hw / 2 - hr, hh / 2);
        lensShape.lineTo(-hw / 2 + hr, hh / 2);
        lensShape.quadraticCurveTo(-hw / 2, hh / 2, -hw / 2, hh / 2 - hr);
        lensShape.lineTo(-hw / 2, -hh / 2 + hr);
        lensShape.quadraticCurveTo(-hw / 2, -hh / 2, -hw / 2 + hr, -hh / 2);

        const lensGeom = new THREE.ShapeGeometry(lensShape);
        lensGeom.center();
        lensMesh = new THREE.Mesh(lensGeom, this.lensMaterial);
      }

      lensMesh.position.z = 0.02;
      rimGroup.add(rimMesh);
      rimGroup.add(lensMesh);
      group.add(rimGroup);

      // Hinges & Temple Arms (extending backwards toward ears)
      const templeArm = this.createTempleArm(side, separation + rimRadiusX * 0.85);
      group.add(templeArm);
    }

    // Bridge connecting the rims over nose
    const bridgeGeom = new THREE.CylinderGeometry(0.04, 0.04, separation * 0.9, 16);
    bridgeGeom.rotateZ(Math.PI / 2);
    const bridgeMesh = new THREE.Mesh(bridgeGeom, this.frameMaterial);
    bridgeMesh.position.set(0, 0.1, 0.03);
    group.add(bridgeMesh);

    // Top brow bar for Aviators
    if (style === 'aviator') {
      const topBarGeom = new THREE.CylinderGeometry(0.03, 0.03, separation * 1.5, 16);
      topBarGeom.rotateZ(Math.PI / 2);
      const topBarMesh = new THREE.Mesh(topBarGeom, this.metalAccentMaterial);
      topBarMesh.position.set(0, 0.42, 0.03);
      group.add(topBarMesh);
    }

    // Nose pads
    for (let side of [-1, 1]) {
      const padGeom = new THREE.CapsuleGeometry(0.035, 0.08, 8, 12);
      const padMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3, transparent: true, opacity: 0.8 });
      const padMesh = new THREE.Mesh(padGeom, padMat);
      padMesh.position.set(side * 0.22, -0.15, -0.1);
      padMesh.rotation.z = side * 0.3;
      group.add(padMesh);
    }

    this.currentGlassesMesh = group;
    this.glassesAnchor.add(this.currentGlassesMesh);
  }

  /**
   * Creates a realistic temple arm with ear-hook curving backward into 3D space
   */
  createTempleArm(side, xOffset) {
    const armGroup = new THREE.Group();
    armGroup.position.set(side * xOffset, 0.15, 0);

    // Arm curve path stretching back toward Z = -2.8
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(side * 0.05, 0.02, -1.2),
      new THREE.Vector3(side * 0.08, 0, -2.4),
      new THREE.Vector3(side * 0.07, -0.3, -2.8) // Ear hook
    ]);

    const armGeom = new THREE.TubeGeometry(armCurve, 20, 0.035, 8, false);
    const armMesh = new THREE.Mesh(armGeom, this.frameMaterial);
    armGroup.add(armMesh);

    return armGroup;
  }

  /**
   * Updates frame color and material parameters in real time
   */
  updateFrameColor(colorConfig) {
    if (!colorConfig) return;
    this.currentColor = colorConfig;
    if (this.frameMaterial) {
      this.frameMaterial.color.set(colorConfig.hex);
      this.frameMaterial.metalness = colorConfig.metalness ?? 0.2;
      this.frameMaterial.roughness = colorConfig.roughness ?? 0.5;
      this.frameMaterial.needsUpdate = true;
    }
  }

  /**
   * Updates lens tint and transparency in real time
   */
  updateLensTint(lensConfig) {
    if (!lensConfig) return;
    this.currentLens = lensConfig;
    if (this.lensMaterial) {
      this.lensMaterial.color.set(lensConfig.hex);
      this.lensMaterial.opacity = lensConfig.opacity ?? 0.2;
      this.lensMaterial.roughness = lensConfig.roughness ?? 0.05;
      this.lensMaterial.needsUpdate = true;
    }
  }

  /**
   * Switches glasses style (wayfarer, aviator, round, cat-eye, hexagonal, rectangle)
   */
  setStyle(styleName) {
    if (this.currentStyle === styleName) return;
    this.currentStyle = styleName;
    this.buildGlassesModel(styleName);
  }

  /**
   * Update tracking pose each frame (ZERO allocations, using pre-cached vectors)
   */
  updatePose(landmarks, canvasWidth, canvasHeight) {
    if (!landmarks || landmarks.length < 468) {
      this.glassesAnchor.visible = false;
      if (this.headOccluder) this.headOccluder.visible = false;
      return;
    }

    // Key facial anchor landmarks
    // 168 = Midpoint between eyes / upper nose bridge
    // 6 = Middle of nose bridge
    // 234 = Left temple / zygion
    // 454 = Right temple / zygion
    // 10 = Top forehead
    // 152 = Chin bottom
    const noseLandmark = landmarks[168] || landmarks[6] || landmarks[1];
    const leftTempleLm = landmarks[234];
    const rightTempleLm = landmarks[454];
    const foreheadLm = landmarks[10];
    const chinLm = landmarks[152];

    // Normalized screen coordinates mapped to Three.js camera viewport (-1 to +1)
    // Note: Video is mirrored in CSS (scaleX(-1)), so we flip X coordinate accordingly
    const aspect = canvasWidth / canvasHeight;
    const vFovRad = (this.camera.fov * Math.PI) / 180;
    const dist = 10.0; // Distance of camera from origin
    const planeHeight = 2.0 * Math.tan(vFovRad / 2) * dist;
    const planeWidth = planeHeight * aspect;

    // Map Nose Bridge 3D position
    // landmarks.x and y are in [0, 1] range
    const noseX = (0.5 - noseLandmark.x) * planeWidth;
    const noseY = (0.5 - noseLandmark.y) * planeHeight;
    const noseZ = (noseLandmark.z || 0) * -planeWidth * 0.8;
    _targetPos.set(noseX, noseY, noseZ);

    // Map Temple positions for orientation and scale
    _leftTemple.set((0.5 - leftTempleLm.x) * planeWidth, (0.5 - leftTempleLm.y) * planeHeight, (leftTempleLm.z || 0) * -planeWidth * 0.8);
    _rightTemple.set((0.5 - rightTempleLm.x) * planeWidth, (0.5 - rightTempleLm.y) * planeHeight, (rightTempleLm.z || 0) * -planeWidth * 0.8);
    _forehead.set((0.5 - foreheadLm.x) * planeWidth, (0.5 - foreheadLm.y) * planeHeight, (foreheadLm.z || 0) * -planeWidth * 0.8);
    _chin.set((0.5 - chinLm.x) * planeWidth, (0.5 - chinLm.y) * planeHeight, (chinLm.z || 0) * -planeWidth * 0.8);

    // Eye vector: Left temple to Right temple gives head Roll and Yaw
    _eyeVec.subVectors(_rightTemple, _leftTemple).normalize();
    // Vertical vector: Chin to Forehead gives head Pitch
    _faceVerticalVec.subVectors(_forehead, _chin).normalize();
    // Face normal (pointing out from face)
    _faceNormalVec.crossVectors(_eyeVec, _faceVerticalVec).normalize();

    // Calculate rotation angles
    // Roll: rotation in XY plane
    const roll = Math.atan2(_eyeVec.y, _eyeVec.x);
    // Yaw: head turning left/right (based on Z delta of temples)
    const yaw = Math.atan2(_eyeVec.z, Math.hypot(_eyeVec.x, _eyeVec.y));
    // Pitch: head nodding up/down
    const pitch = -Math.atan2(_faceVerticalVec.z, Math.hypot(_faceVerticalVec.x, _faceVerticalVec.y));

    _targetEuler.set(pitch, yaw, roll, 'YXZ');
    _targetQuat.setFromEuler(_targetEuler);

    // Scale glasses proportionally to temple-to-temple distance
    const faceSpan = _leftTemple.distanceTo(_rightTemple);
    const baseScale = (faceSpan / 2.3) * 0.95;
    _targetScale.set(baseScale, baseScale, baseScale);

    // Exponential smoothing to eliminate micro-jitter
    if (!this.hasInitialPose) {
      this.smoothedPos.copy(_targetPos);
      this.smoothedScale.copy(_targetScale);
      this.smoothedQuat.copy(_targetQuat);
      this.hasInitialPose = true;
    } else {
      this.smoothedPos.lerp(_targetPos, this.lerpFactor);
      this.smoothedScale.lerp(_targetScale, this.lerpFactor);
      this.smoothedQuat.slerp(_targetQuat, this.lerpFactor);
    }

    // Apply to glasses anchor
    this.glassesAnchor.position.copy(this.smoothedPos);
    this.glassesAnchor.scale.copy(this.smoothedScale);
    this.glassesAnchor.quaternion.copy(this.smoothedQuat);
    this.glassesAnchor.visible = true;

    // Apply to head occluder (placed just behind the glasses anchor)
    if (this.headOccluder) {
      this.headOccluder.position.copy(this.smoothedPos);
      this.headOccluder.quaternion.copy(this.smoothedQuat);
      this.headOccluder.scale.copy(this.smoothedScale);
      // Occluder depth offset
      this.headOccluder.translateZ(-0.9 * baseScale);
      this.headOccluder.visible = true;
    }
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  resize(width, height) {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  disposeObject(obj) {
    if (!obj) return;
    obj.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  destroy() {
    if (this.currentGlassesMesh) this.disposeObject(this.currentGlassesMesh);
    if (this.headOccluder) this.disposeObject(this.headOccluder);
    if (this.frameMaterial) this.frameMaterial.dispose();
    if (this.lensMaterial) this.lensMaterial.dispose();
    if (this.metalAccentMaterial) this.metalAccentMaterial.dispose();
    if (this.renderer) {
      this.renderer.dispose();
    }
    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }
}
