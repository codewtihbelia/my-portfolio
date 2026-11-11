import { 
  collection, doc, getDocs, addDoc, deleteDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Media } from '../types';
import { 
  uploadToCloudinary, 
  getCloudinaryConfig, 
  isCloudinaryUrl 
} from './cloudinaryService';

const COLLECTION_NAME = 'media';

export async function getMediaItems(): Promise<Media[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const list: Media[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({ 
        id: docSnap.id, 
        provider: data.provider || (isCloudinaryUrl(data.url) ? 'cloudinary' : 'firebase'),
        ...data 
      } as Media);
    });
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  } catch (error) {
    console.warn('Media items fetch notice:', error);
    return [];
  }
}

export async function uploadMediaFile(
  file: File, 
  category = 'general',
  altText = ''
): Promise<Media> {
  const cloudinaryConfig = getCloudinaryConfig();

  // If Cloudinary is configured, ALWAYS handle uploaded images through Cloudinary
  if (cloudinaryConfig.isConfigured) {
    try {
      const cloudResult = await uploadToCloudinary(file, {
        folder: `portfolio/${category}`,
        category
      });

      const mediaData: Omit<Media, 'id'> = {
        filename: file.name,
        fileName: file.name,
        url: cloudResult.secure_url,
        downloadUrl: cloudResult.secure_url,
        storagePath: cloudResult.public_id,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        mimeType: file.type || `${cloudResult.resource_type}/${cloudResult.format}`,
        size: cloudResult.bytes || file.size,
        altText: altText || file.name,
        category,
        provider: 'cloudinary',
        cloudinaryPublicId: cloudResult.public_id,
        width: cloudResult.width,
        height: cloudResult.height,
        format: cloudResult.format,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), mediaData);
      return { id: docRef.id, ...mediaData };
    } catch (cloudErr: any) {
      console.error('Failed to upload image to Cloudinary:', cloudErr);
      throw new Error(cloudErr.message || 'Failed to upload image to Cloudinary.');
    }
  }

  // If Cloudinary is not yet configured, throw descriptive error prompting setup
  throw new Error(
    'Cloudinary is not configured yet. Please configure your Cloudinary Cloud Name and Unsigned Upload Preset in Admin Settings or .env file (VITE_CLOUDINARY_CLOUD_NAME & VITE_CLOUDINARY_UPLOAD_PRESET) to upload images.'
  );
}

export async function deleteMediaItem(id: string, storagePath?: string, provider?: 'cloudinary' | 'firebase'): Promise<void> {
  try {
    // Only attempt Firebase Storage deletion if it was hosted in Firebase Storage
    if (provider !== 'cloudinary' && storagePath && storagePath.startsWith('media/')) {
      try {
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
      } catch (storageErr) {
        console.warn('Firebase Storage file deletion notice:', storageErr);
      }
    }
    
    // Delete Firestore document reference
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting media item:', error);
    throw error;
  }
}

export const getMediaAssets = getMediaItems;
export const uploadMediaAsset = uploadMediaFile;
export const deleteMediaAsset = deleteMediaItem;

