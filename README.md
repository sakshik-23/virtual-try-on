# 👓 Spectra Optics — 3D Virtual Try-On & 360° Eyewear Experience

A modern, high-performance web application for real-time 3D eyewear virtual try-on, automated AI facial analysis, and 360° interactive studio inspection — built for zero latency directly in the browser.

---

## ✨ Features

- **🎯 Real-Time 3D Virtual Try-On**:
  - Zero-latency face tracking in the browser powered by **MediaPipe Face Mesh (468 facial landmarks)** and **Three.js**.
  - Anatomically scales and aligns spectacles to your interpupillary distance (IPD) and nose bridge.
  - Interactive "Calibrate Fit" drawer to fine-tune frame size, vertical position, and depth in real time.

- **🤖 AI Facial Shape Analysis**:
  - Analyzes face proportions to classify face shapes (*Oval, Round, Square, Heart, Diamond, Oblong*).
  - Recommends the most complementary frame geometries based on optical styling rules.

- **🔄 360° Studio Interactive Viewer**:
  - Full free-rotation 3D orbit around luxury eyewear models.
  - Quick view angle presets: *Front*, *3/4 Studio View*, *Opposite 3/4*, and *Detail*.
  - Continuous auto-spin toggle with live rotation angle dial (`0°` to `360°`).
  - High-fidelity studio lighting with crystal-clear anti-glare lenses.

- **👗 AI Style & Outfit Matcher**:
  - Interactive questionnaire recommending curated frames according to vibe (*Professional, Trendy, Minimalist*) and outfit preferences.

- **🛍️ Complete E-Commerce Experience**:
  - Catalog browsing with frame shape filtering (*Wayfarer, Round, Cat-Eye, Rectangle*).
  - Color variant swatches and lens tint options.
  - Shopping cart drawer with instant order summary.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **3D Graphics & AR**: Three.js, `@mediapipe/tasks-vision`
- **Styling**: Tailwind CSS, Vanilla CSS
- **Icons**: Lucide React
- **Backend (Optional)**: Python FastAPI, SQLAlchemy (ACID-compliant architecture)

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/sakshik-23/virtual-try-on.git
cd virtual-try-on
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```

Open your browser and navigate to **`http://localhost:5173/`**.

### 4. Build for production
```bash
npm run build
```

---

## 📁 Project Structure

```text
virtual-try-on/
├── public/
│   ├── images/eyewear/        # Studio photos & transparent cutouts
│   └── models/                # Offline MediaPipe Face Landmarker models
├── src/
│   ├── components/
│   │   ├── Navbar.jsx               # Header & brand navigation
│   │   ├── ProductCatalog.jsx       # Catalog grid & shape filters
│   │   ├── ThreeSixtyModal.jsx      # 360° interactive studio viewer
│   │   ├── VirtualTryOn.jsx         # MediaPipe live webcam AR try-on
│   │   ├── FaceAnalysisCard.jsx     # Biometric face shape detector
│   │   ├── StyleQuizModal.jsx       # AI outfit & vibe matcher
│   │   └── CartDrawer.jsx           # Shopping cart slideout
│   ├── services/
│   │   ├── catalogData.js           # Eyewear models & face shape specs
│   │   ├── faceLandmarkerService.js # MediaPipe landmark extraction
│   │   └── threeGlassesEngine.js    # Three.js 3D glasses positioning
│   ├── App.jsx                      # Main routing & application state
│   └── index.css                    # Design system tokens & typography
├── backend/                         # Optional FastAPI & PostgreSQL backend
└── package.json
```

---

## 🔒 Privacy & Performance

- **100% Client-Side Video Processing**: Webcam video streams are processed entirely on-device inside your browser using WebAssembly (WASM). No video or facial image data is ever uploaded to external servers.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
