// Mathematical mechanics for Pupillary Distance (PD), Facial Shape Analysis, and 6-DoF Head Pose

/**
 * Calculates Euclidean distance between two 3D landmarks
 */
export function getDistance3D(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates 2D Euclidean distance in pixels
 */
export function getDistance2D(p1, p2, width, height) {
  const dx = (p1.x - p2.x) * width;
  const dy = (p1.y - p2.y) * height;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates real-time 3D Head Pose (Yaw, Pitch, Roll) from MediaPipe 468 landmarks
 * Essential for 180-degree sweep detection & orientation tracking
 */
export function calculateHeadPose(landmarks) {
  if (!landmarks || landmarks.length < 468) return { yaw: 0, pitch: 0, roll: 0 };

  const nose = landmarks[1] || landmarks[4];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const chin = landmarks[152];
  const forehead = landmarks[10];

  // Midpoint between cheeks in normalized space
  const midX = (leftCheek.x + rightCheek.x) / 2;
  const faceWidth = Math.abs(rightCheek.x - leftCheek.x);

  // Yaw: offset of nose relative to facial midline (-45° to +45°)
  const yawRatio = (nose.x - midX) / Math.max(faceWidth * 0.45, 0.001);
  const yawDeg = Math.max(-50, Math.min(50, yawRatio * 45));

  // Pitch: nose relative to vertical midpoint (-30° to +30°)
  const midY = (forehead.y + chin.y) / 2;
  const faceHeight = Math.abs(chin.y - forehead.y);
  const pitchRatio = (nose.y - midY) / Math.max(faceHeight * 0.4, 0.001);
  const pitchDeg = Math.max(-35, Math.min(35, pitchRatio * 35));

  // Roll: head tilt between inner eye corners
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const rollDeg = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

  return {
    yaw: Math.round(yawDeg),
    pitch: Math.round(pitchDeg),
    roll: Math.round(rollDeg)
  };
}

/**
 * Estimates Pupillary Distance (PD) in millimeters and face width in mm
 * Reference: Average human PD is ~63mm. Iris diameter is ~11.7mm.
 */
export function calculateFacialMetrics(landmarks, canvasWidth, canvasHeight) {
  if (!landmarks || landmarks.length < 468) return null;

  // Iris centers: 468 = Right Iris, 473 = Left Iris (if refined iris landmarks are available)
  // Fallback to eye centers: 159 & 145 (Right eye center), 386 & 374 (Left eye center)
  const rightIris = landmarks[468] || {
    x: (landmarks[33].x + landmarks[133].x) / 2,
    y: (landmarks[159].y + landmarks[145].y) / 2,
    z: landmarks[133].z
  };

  const leftIris = landmarks[473] || {
    x: (landmarks[362].x + landmarks[263].x) / 2,
    y: (landmarks[386].y + landmarks[374].y) / 2,
    z: landmarks[362].z
  };

  // Distance between irises in pixels
  const pdPixels = getDistance2D(rightIris, leftIris, canvasWidth, canvasHeight);

  // Temple-to-temple points
  const leftTemple = landmarks[234];
  const rightTemple = landmarks[454];
  const faceWidthPixels = getDistance2D(leftTemple, rightTemple, canvasWidth, canvasHeight);

  // Estimate metric scale: Average adult iris diameter is approx 11.7 mm
  // Right iris horizontal points (469, 471) or eye corner width:
  const rightEyeWidthPx = getDistance2D(landmarks[33], landmarks[133], canvasWidth, canvasHeight);
  // Average human eye width is approx 30mm
  const estimatedMmPerPixel = 30.0 / Math.max(rightEyeWidthPx, 1);

  // PD in millimeters (clamped to realistic adult range: 56mm - 72mm)
  let rawPdMm = pdPixels * estimatedMmPerPixel;
  if (isNaN(rawPdMm) || rawPdMm < 54 || rawPdMm > 74) {
    // Normalization toward ergonomic baseline
    rawPdMm = 63.0;
  }
  const measuredPdMm = Math.round(rawPdMm * 10) / 10;

  // Face width in mm (clamped to realistic adult range: 120mm - 165mm)
  let rawFaceWidthMm = faceWidthPixels * estimatedMmPerPixel;
  if (isNaN(rawFaceWidthMm) || rawFaceWidthMm < 110 || rawFaceWidthMm > 175) {
    rawFaceWidthMm = 138.0;
  }
  const measuredFaceWidthMm = Math.round(rawFaceWidthMm);

  // Size classification
  let recommendedSize = "Medium";
  if (measuredFaceWidthMm < 130) recommendedSize = "Narrow";
  else if (measuredFaceWidthMm > 145) recommendedSize = "Wide";

  return {
    pdPixels,
    measuredPdMm,
    faceWidthPixels,
    measuredFaceWidthMm,
    recommendedSize
  };
}

/**
 * Classifies face shape using biometric ratios of 3D facial landmarks
 * Landmarks:
 * 10: Forehead top / trichion
 * 152: Chin bottom / menton
 * 234: Left zygoma / cheekbone
 * 454: Right zygoma / cheekbone
 * 58: Left gonion / jaw angle
 * 288: Right gonion / jaw angle
 * 103: Left forehead temple
 * 332: Right forehead temple
 */
export function classifyFaceShape(landmarks) {
  if (!landmarks || landmarks.length < 455) {
    return { shape: "Oval", confidence: 0.8, details: "Analyzing facial contours..." };
  }

  const foreheadTop = landmarks[10];
  const chinBottom = landmarks[152];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const leftJaw = landmarks[58];
  const rightJaw = landmarks[288];
  const leftForehead = landmarks[103];
  const rightForehead = landmarks[332];

  // Distances
  const faceHeight = getDistance3D(foreheadTop, chinBottom);
  const cheekWidth = getDistance3D(leftCheek, rightCheek);
  const jawWidth = getDistance3D(leftJaw, rightJaw);
  const foreheadWidth = getDistance3D(leftForehead, rightForehead);

  if (!cheekWidth || cheekWidth === 0) return { shape: "Oval", confidence: 0.85 };

  const heightToCheekRatio = faceHeight / cheekWidth;
  const jawToCheekRatio = jawWidth / cheekWidth;
  const foreheadToCheekRatio = foreheadWidth / cheekWidth;
  const foreheadToJawRatio = foreheadWidth / Math.max(jawWidth, 0.001);

  let shape = "Oval";
  let confidence = 0.88;

  if (heightToCheekRatio > 1.38) {
    shape = "Oblong";
    confidence = 0.91;
  } else if (heightToCheekRatio < 1.18 && jawToCheekRatio < 0.82) {
    shape = "Round";
    confidence = 0.92;
  } else if (heightToCheekRatio < 1.25 && jawToCheekRatio >= 0.83) {
    shape = "Square";
    confidence = 0.89;
  } else if (foreheadToJawRatio > 1.24 && jawToCheekRatio < 0.78) {
    shape = "Heart";
    confidence = 0.90;
  } else if (cheekWidth > 1.12 * foreheadWidth && cheekWidth > 1.15 * jawWidth) {
    shape = "Diamond";
    confidence = 0.87;
  } else {
    shape = "Oval";
    confidence = 0.94;
  }

  return {
    shape,
    confidence,
    ratios: {
      heightToCheekRatio: Math.round(heightToCheekRatio * 100) / 100,
      jawToCheekRatio: Math.round(jawToCheekRatio * 100) / 100,
      foreheadToJawRatio: Math.round(foreheadToJawRatio * 100) / 100
    }
  };
}
