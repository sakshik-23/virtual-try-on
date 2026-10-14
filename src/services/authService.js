/**
 * Spectra Optics - Authentication API Service
 * Connects frontend auth flows to FastAPI backend (http://localhost:8000/api/auth)
 * Persisting user credentials in ACID SQLite database.
 */

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class AuthService {
  constructor(apiBaseUrl = DEFAULT_API_URL) {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Register a new user in the database
   */
  async register({ name, email, password, phone }) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone ? phone.trim() : null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed. Please try again.');
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Unable to reach backend auth server. Please ensure backend is running.');
      }
      throw err;
    }
  }

  /**
   * Log in user with email/mobile and password
   */
  async login({ email, password }) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Sign In failed. Please check your credentials.');
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Unable to reach backend auth server. Please ensure backend is running.');
      }
      throw err;
    }
  }

  /**
   * Fetch current user profile
   */
  async getCurrentUser(email) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/auth/me?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
