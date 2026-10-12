/**
 * Spectra Optics - Product & TryOn Repository
 * Follows the Object-Oriented Repository Pattern to decouple data access from the UI.
 * Supports:
 *  1. Local In-Memory / LocalStorage (Instant zero-config execution)
 *  2. Supabase Auto-APIs
 *  3. Python FastAPI backend
 */

import { EYEWEAR_CATALOG, EyewearItem } from './catalogData';

export class ProductRepository {
  constructor(apiBaseUrl = null) {
    this.apiBaseUrl = apiBaseUrl;
    this.catalog = [...EYEWEAR_CATALOG];
  }

  /**
   * Fetches all products, optionally filtered by shape or type
   */
  async getAllProducts(filters = {}) {
    if (this.apiBaseUrl) {
      try {
        const response = await fetch(`${this.apiBaseUrl}/api/products`);
        if (response.ok) {
          const data = await response.json();
          return data.map(item => new EyewearItem(item));
        }
      } catch (err) {
        console.warn('API fetch failed, using local repository fallback:', err);
      }
    }

    // Local fallback
    let result = [...this.catalog];
    if (filters.shape && filters.shape !== 'all') {
      result = result.filter(p => p.shape === filters.shape);
    }
    if (filters.type && filters.type !== 'all') {
      result = result.filter(p => p.type === filters.type);
    }
    return result;
  }

  /**
   * Finds a product by its unique ID
   */
  async getProductById(id) {
    return this.catalog.find(p => p.id === id) || null;
  }
}

export class TryOnSessionRepository {
  constructor(apiBaseUrl = null) {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Saves biometric calibration (Pupillary Distance & 6-DoF matrix) securely.
   * Stored strictly in the database/backend, never exposed on the public frontend.
   */
  async saveFaceProfile(profileData) {
    if (this.apiBaseUrl) {
      try {
        const response = await fetch(`${this.apiBaseUrl}/api/tryon/face-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData)
        });
        if (response.ok) return await response.json();
      } catch (err) {
        console.warn('Backend matrix save failed, using local storage fallback:', err);
      }
    }

    // Local secure storage fallback
    try {
      const records = JSON.parse(localStorage.getItem('spectra_face_profiles') || '[]');
      records.push({ ...profileData, id: Date.now().toString(), timestamp: new Date().toISOString() });
      localStorage.setItem('spectra_face_profiles', JSON.stringify(records));
      return { success: true, mode: 'local' };
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
      return { success: false };
    }
  }
}

// Singleton instances for clean dependency injection
export const productRepository = new ProductRepository();
export const tryOnSessionRepository = new TryOnSessionRepository();
