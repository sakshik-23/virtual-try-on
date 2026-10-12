import React, { useState } from 'react';
import { X, Database, Server, HardDrive, Check, Copy, Code2, Shield } from 'lucide-react';

export function DatabaseGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sqlSchema = `-- ========================================================
-- LENSKART VIRTUAL TRY-ON (VTO) DATABASE SCHEMA
-- Storing 3D Matrix, Biometric Landmarks, and 3D Assets
-- ========================================================

-- 1. Eyewear Product Catalog & 3D Assets
CREATE TABLE eyewear_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(64) UNIQUE NOT NULL,
    brand VARCHAR(100) NOT NULL,            -- e.g. 'Vincent Chase', 'John Jacobs'
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2) NOT NULL,
    frame_shape VARCHAR(50) NOT NULL,       -- 'wayfarer', 'aviator', 'cat-eye', 'round'
    frame_type VARCHAR(50) NOT NULL,        -- 'full-rim', 'half-rim', 'rimless'
    frame_size VARCHAR(20) NOT NULL,        -- 'Narrow', 'Medium', 'Wide'
    
    -- Physical Dimensions in Millimeters (Used for Real-World 3D Scaling)
    lens_width_mm INT NOT NULL,             -- e.g. 52
    bridge_width_mm INT NOT NULL,           -- e.g. 18
    temple_length_mm INT NOT NULL,          -- e.g. 142
    frame_width_mm INT NOT NULL,            -- e.g. 138 (matches user temple-to-temple width)

    -- 3D Model Asset URLs & Material Configurations
    model_3d_url VARCHAR(500),              -- AWS S3 / CloudFront URL to .glb file
    available_colors JSONB NOT NULL,        -- [{"name": "Gold", "hex": "#d4af37", "metalness": 0.9}]
    available_lenses JSONB NOT NULL,        -- [{"name": "BLU", "hex": "#cffafe", "opacity": 0.18}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User 3D Facial Mesh & Transformation Matrix (Kept hidden from UI, stored in DB)
CREATE TABLE user_face_matrices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,                           -- Foreign key to users table (or null for guest)
    session_token VARCHAR(255) NOT NULL,    -- Anonymous browser session token
    
    -- Estimated Pupillary Distance (PD) in Millimeters
    pupillary_distance_mm DECIMAL(4, 1) NOT NULL, -- e.g. 63.5 mm
    face_width_mm INT NOT NULL,                   -- e.g. 139 mm
    detected_face_shape VARCHAR(50) NOT NULL,      -- 'Oval', 'Round', 'Square', 'Oblong'

    -- Raw 6-DoF Transformation Matrix: [Translation (x,y,z), Rotation (pitch,yaw,roll)]
    transformation_matrix JSONB NOT NULL,   -- {"translation": {"x": 0.02, "y": 0.14, "z": -1.2}, "rotation": {"pitch": 0.05, "yaw": -0.02, "roll": 0.01}}

    -- Full 478 MediaPipe 3D Landmark Coordinate Tensor
    facial_landmarks_478 JSONB NOT NULL,    -- Dense normalized (x, y, z) coordinate array
    
    -- User's 3D Captured Selfie Texture (Selfie Try-On Grid)
    selfie_image_url TEXT,                  -- Cloud storage URL or base64 image
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Saved Try-On Looks & Comparisons
CREATE TABLE user_tryon_looks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) NOT NULL,
    product_id UUID REFERENCES eyewear_products(id) ON DELETE CASCADE,
    rendered_look_url TEXT NOT NULL,        -- Captured composite photo of user wearing specs
    selected_color_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#000042] flex items-center justify-center text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-900 leading-tight">
                Database Setup & Matrix Storage Architecture
              </h3>
              <p className="text-xs text-slate-500">
                How 3D face matrices, Pupillary Distance, and 3D frame assets are managed in the database.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Key Principle: Matrices Stored in DB, Not on Frontend */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#000042] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Why Matrices are Kept Hidden from Frontend:</strong> Real-world applications like Lenskart calculate the 6-DoF transformation matrix and 478 MediaPipe landmarks locally in memory to drive the WebGL render, but store them as compressed <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[#000042]">JSONB</code> records in PostgreSQL. This protects biometric data, maintains a clean shopping UI, and lets in-store optometrists retrieve the user's exact Pupillary Distance (PD).
            </div>
          </div>

          {/* Database Architecture Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2 text-[#000042]">
                <Database className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">1. PostgreSQL Engine</span>
              </div>
              <p className="text-xs font-semibold text-slate-900 mb-1">Supabase / Neon / AWS RDS</p>
              <p className="text-[11px] text-slate-500">
                Stores products, millimeter dimensions, orders, and JSONB face matrices with high ACID reliability.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2 text-amber-600">
                <HardDrive className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">2. 3D Asset Storage</span>
              </div>
              <p className="text-xs font-semibold text-slate-900 mb-1">AWS S3 + CloudFront CDN</p>
              <p className="text-[11px] text-slate-500">
                Hosts Draco-compressed <code className="text-slate-700 font-mono">.glb</code> 3D models under 2MB for instant mobile streaming.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2 text-emerald-600">
                <Server className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">3. Session & Sync</span>
              </div>
              <p className="text-xs font-semibold text-slate-900 mb-1">Redis Session Cache</p>
              <p className="text-[11px] text-slate-500">
                Matches guest session tokens so try-on looks seamlessly sync between mobile web and store POS tablets.
              </p>
            </div>
          </div>

          {/* SQL Schema Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Code2 className="w-4 h-4 text-[#000042]" />
                <span>Production PostgreSQL DDL Script</span>
              </div>
              <button
                onClick={() => copyToClipboard(sqlSchema, 'sql')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200"
              >
                {copiedKey === 'sql' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Schema SQL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed max-h-64">
              {sqlSchema}
            </pre>
          </div>

          {/* Step by step connection guide */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Step-by-Step Setup Guide:
            </h4>
            <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                <strong>Create Supabase or PostgreSQL Database:</strong> Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">supabase.com</a>, create a free project, and open the <em>SQL Editor</em>.
              </li>
              <li>
                <strong>Run the Schema:</strong> Paste the SQL script above to generate the <code className="font-mono text-slate-800">eyewear_products</code> and <code className="font-mono text-slate-800">user_face_matrices</code> tables.
              </li>
              <li>
                <strong>Connect in Frontend:</strong> Run <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">npm install @supabase/supabase-js</code> and initialize the client to push user PD & matrices directly after camera scans.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
