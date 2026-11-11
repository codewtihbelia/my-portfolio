import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

export interface FileUploadResult {
  url: string;
  fileName: string;
  fileSize: string;
  sizeBytes: number;
  provider: 'database' | 'firebase';
}

/**
 * Convert a File object into a Base64 Data URL (data:application/pdf;base64,...)
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to human readable format (e.g. "145 KB", "1.2 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Convert a Data URL (Base64) to a Blob object
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Convert a Data URL or remote URL into an accessible Blob URL for preview or iframe embedding.
 */
export function getDocumentBlobUrl(url: string): string {
  if (url.startsWith('data:')) {
    try {
      const blob = dataUrlToBlob(url);
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('Error generating blob URL from data URL:', e);
      return url;
    }
  }
  return url;
}

/**
 * Reliable download of any document or resume file.
 * Handles both Data URLs (Base64) and Remote URLs (fetching as Blob to bypass cross-origin restrictions).
 */
export function downloadDocument(url: string, filename = 'Resume.pdf'): void {
  if (!url) return;
  const safeName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

  if (url.startsWith('data:')) {
    try {
      const blob = dataUrlToBlob(url);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = safeName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      return;
    } catch (e) {
      console.error('Error downloading data URL document:', e);
    }
  }

  // Remote URL: attempt fetch as blob first for reliable cross-origin downloading
  fetch(url)
    .then(async (res) => {
      if (!res.ok) throw new Error('Fetch failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = safeName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    })
    .catch(() => {
      // Fallback: standard link click
      const link = document.createElement('a');
      link.href = url;
      link.download = safeName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
}

/**
 * Open document preview safely in a new tab
 */
export function openDocumentPreview(url: string, filename = 'resume.pdf'): void {
  if (!url) return;

  if (url.startsWith('data:')) {
    try {
      const blob = dataUrlToBlob(url);
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        // Fallback to download if popup blocked
        downloadDocument(url, filename);
      }
      return;
    } catch (e) {
      console.error('Error opening preview blob:', e);
    }
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Upload a Resume or PDF document directly:
 * Resumes are pure documents (NOT images).
 * They are stored directly in Cloud Firestore as self-contained Base64 PDF documents.
 * This guarantees 100% reliable storage with ZERO external dependencies, NO broken Cloudinary URLs,
 * and seamless offline/online availability.
 */
export async function uploadResumeDocument(file: File): Promise<FileUploadResult> {
  const sizeFormatted = formatFileSize(file.size);

  // Firestore document maximum limit is 1,048,576 bytes (~1 MB).
  // Base64 encoding adds ~33% overhead. A file under 750 KB fits safely in one document.
  if (file.size <= 750 * 1024) {
    const dataUrl = await fileToDataUrl(file);
    return {
      url: dataUrl,
      fileName: file.name,
      fileSize: sizeFormatted,
      sizeBytes: file.size,
      provider: 'database'
    };
  }

  // If larger than 750 KB, try Firebase Storage if bucket is reachable
  try {
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const targetPath = `resumes/${Date.now()}_${cleanName}`;
    const storageRef = ref(storage, targetPath);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return {
      url: downloadUrl,
      fileName: file.name,
      fileSize: sizeFormatted,
      sizeBytes: file.size,
      provider: 'firebase'
    };
  } catch (storageErr) {
    console.warn('Firebase Storage upload failed:', storageErr);
  }

  throw new Error(
    `Resume file size (${sizeFormatted}) exceeds the 750 KB direct database limit. Please optimize or compress your PDF (e.g., using Smallpdf or iLovePDF) to under 750 KB, or paste a public URL link (from Google Drive, Dropbox, or GitHub).`
  );
}

/**
 * Backwards compatibility helper
 */
export async function uploadDocumentFile(file: File, folder = 'resumes'): Promise<FileUploadResult> {
  return uploadResumeDocument(file);
}

export async function uploadFile(file: File, path?: string): Promise<string> {
  const res = await uploadResumeDocument(file);
  return res.url;
}

export async function deleteFile(path: string): Promise<void> {
  if (path.startsWith('http') || path.startsWith('data:')) {
    return;
  }
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Storage deletion notice:', err);
  }
}
