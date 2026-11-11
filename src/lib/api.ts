/**
 * Backend API Client & URL Resolver
 * 
 * Supports both:
 * 1. Unified deployment (relative `/api/*` endpoints)
 * 2. Separated Render deployment (e.g., frontend on Render Static Site calling backend Web Service via VITE_API_URL)
 */

const RAW_API_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL 
  ? String(import.meta.env.VITE_API_URL).trim() 
  : '';

export const API_BASE_URL = RAW_API_URL.replace(/\/$/, '');

export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If in browser and in development/preview or localhost, route directly to the active Express server
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isAiStudio = window.location.hostname.includes('aistudio') || window.location.hostname.includes('webcontainer') || window.location.hostname.includes('run.app');
    if (isLocalhost || isAiStudio || import.meta.env.DEV || !API_BASE_URL) {
      return cleanEndpoint;
    }
  }

  if (!API_BASE_URL) {
    return cleanEndpoint;
  }
  return `${API_BASE_URL}${cleanEndpoint}`;
}

export interface BackendHealthResponse {
  status: string;
  service: string;
  uptime: number;
  timestamp: string;
  environment: string;
}

export async function checkBackendHealth(): Promise<BackendHealthResponse | null> {
  try {
    const res = await fetch(getApiUrl('/api/health'));
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
