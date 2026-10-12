# Re-download local Three.js + MediaPipe files if vendor/ or models/ is missing.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

New-Item -ItemType Directory -Force -Path "vendor\mediapipe\wasm","models" | Out-Null

$files = @(
    @{ Url = "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js"; Out = "vendor\three.min.js" },
    @{ Url = "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.min.js"; Out = "vendor\three.module.min.js" },
    @{ Url = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs"; Out = "vendor\mediapipe\vision_bundle.mjs" },
    @{ Url = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm/vision_wasm_internal.js"; Out = "vendor\mediapipe\wasm\vision_wasm_internal.js" },
    @{ Url = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm/vision_wasm_internal.wasm"; Out = "vendor\mediapipe\wasm\vision_wasm_internal.wasm" },
    @{ Url = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm/vision_wasm_nosimd_internal.js"; Out = "vendor\mediapipe\wasm\vision_wasm_nosimd_internal.js" },
    @{ Url = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm/vision_wasm_nosimd_internal.wasm"; Out = "vendor\mediapipe\wasm\vision_wasm_nosimd_internal.wasm" },
    @{ Url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"; Out = "models\face_landmarker.task" }
)

foreach ($file in $files) {
    Write-Host "Downloading $($file.Out) ..."
    Invoke-WebRequest -Uri $file.Url -OutFile $file.Out -UseBasicParsing
}

Write-Host "Done. Serve this folder with: python -m http.server 8080"
