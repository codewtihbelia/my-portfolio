/**
 * Cloudinary Media & Image Upload Service
 * Provides direct, secure unsigned uploads to Cloudinary CDN
 * and URL optimization helpers for portfolio assets.
 */

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  isConfigured: boolean;
}

export interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  resource_type: string;
  created_at: string;
  original_filename?: string;
}

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?: 'scale' | 'fit' | 'limit' | 'mfit' | 'fill' | 'lfill' | 'pad' | 'lpad' | 'crop' | 'thumb';
  quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | string;
  format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg';
}

const STORAGE_KEY_CLOUD_NAME = 'cloudinary_cloud_name';
const STORAGE_KEY_UPLOAD_PRESET = 'cloudinary_upload_preset';

/**
 * Retrieve active Cloudinary configuration from environment variables
 * or local admin configuration.
 */
export function getCloudinaryConfig(): CloudinaryConfig {
  const metaEnv = (import.meta as any).env || {};
  
  const envCloudName = metaEnv.VITE_CLOUDINARY_CLOUD_NAME;
  const envUploadPreset = metaEnv.VITE_CLOUDINARY_UPLOAD_PRESET;

  let localCloudName = '';
  let localUploadPreset = '';

  if (typeof window !== 'undefined') {
    try {
      localCloudName = localStorage.getItem(STORAGE_KEY_CLOUD_NAME) || '';
      localUploadPreset = localStorage.getItem(STORAGE_KEY_UPLOAD_PRESET) || '';
    } catch {
      // Ignore storage access errors in restricted iframe
    }
  }

  const cloudName = (envCloudName || localCloudName || '').trim();
  const uploadPreset = (envUploadPreset || localUploadPreset || '').trim();

  return {
    cloudName,
    uploadPreset,
    isConfigured: Boolean(cloudName && uploadPreset)
  };
}

/**
 * Save Cloudinary configuration into local storage for quick overrides in UI
 */
export function saveCloudinaryConfig(cloudName: string, uploadPreset: string): void {
  if (typeof window !== 'undefined') {
    try {
      if (cloudName) {
        localStorage.setItem(STORAGE_KEY_CLOUD_NAME, cloudName.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_CLOUD_NAME);
      }

      if (uploadPreset) {
        localStorage.setItem(STORAGE_KEY_UPLOAD_PRESET, uploadPreset.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_UPLOAD_PRESET);
      }
    } catch (e) {
      console.warn('Could not persist Cloudinary config to localStorage:', e);
    }
  }
}

/**
 * Upload an image or file asset directly to Cloudinary using unsigned upload preset
 */
export async function uploadToCloudinary(
  file: File | Blob,
  options?: {
    folder?: string;
    tags?: string[];
    category?: string;
    fileName?: string;
  }
): Promise<CloudinaryUploadResult> {
  const config = getCloudinaryConfig();

  if (!config.isConfigured) {
    throw new Error(
      'Cloudinary is not configured yet. Please provide your Cloud Name and Unsigned Upload Preset in Admin Settings or .env file (VITE_CLOUDINARY_CLOUD_NAME & VITE_CLOUDINARY_UPLOAD_PRESET).'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);

  const folder = options?.folder || (options?.category ? `portfolio/${options.category}` : 'portfolio');
  formData.append('folder', folder);

  if (options?.tags && options.tags.length > 0) {
    formData.append('tags', options.tags.join(','));
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/auto/upload`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || `Cloudinary upload failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return {
      url: data.url,
      secure_url: data.secure_url || data.url,
      public_id: data.public_id,
      format: data.format,
      bytes: data.bytes,
      width: data.width,
      height: data.height,
      resource_type: data.resource_type,
      created_at: data.created_at || new Date().toISOString(),
      original_filename: data.original_filename
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Test Cloudinary connection by attempting an upload with a minimal 1x1 test beacon
 */
export async function testCloudinaryConnection(
  cloudName?: string,
  uploadPreset?: string
): Promise<{ success: boolean; message: string }> {
  const targetCloudName = (cloudName || getCloudinaryConfig().cloudName).trim();
  const targetPreset = (uploadPreset || getCloudinaryConfig().uploadPreset).trim();

  if (!targetCloudName || !targetPreset) {
    return {
      success: false,
      message: 'Both Cloud Name and Upload Preset must be specified.'
    };
  }

  // Create a 1x1 transparent PNG blob for connectivity verification
  const byteCharacters = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAA=');
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/png' });

  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', targetPreset);
  formData.append('folder', 'portfolio/_test_connection');

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(targetCloudName)}/image/upload`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      return {
        success: true,
        message: `Successfully connected to Cloudinary (${targetCloudName})!`
      };
    } else {
      return {
        success: false,
        message: data?.error?.message || `Cloudinary responded with error ${res.status}`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error attempting to reach Cloudinary.'
    };
  }
}

/**
 * Checks whether an image URL is hosted on Cloudinary
 */
export function isCloudinaryUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

/**
 * Transform Cloudinary URL to deliver optimized dimensions, formats (WebP/AVIF), and quality
 */
export function getOptimizedImageUrl(
  url: string,
  options?: CloudinaryTransformOptions
): string {
  if (!url || !isCloudinaryUrl(url)) {
    return url;
  }

  // If URL already contains transformation, don't double transform
  if (url.includes('/f_auto,q_auto')) {
    return url;
  }

  const transformations: string[] = ['f_auto', 'q_auto'];

  if (options?.width) {
    transformations.push(`w_${options.width}`);
  }
  if (options?.height) {
    transformations.push(`h_${options.height}`);
  }
  if (options?.crop) {
    transformations.push(`c_${options.crop}`);
  }
  if (options?.quality && options.quality !== 'auto') {
    transformations.push(`q_${options.quality}`);
  }

  const transformString = transformations.join(',');

  // Standard Cloudinary structure: .../upload/(v12345/)?public_id
  return url.replace('/upload/', `/upload/${transformString}/`);
}
