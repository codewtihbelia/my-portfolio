import { 
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SocialLink } from '../types';

const COLLECTION_NAME = 'socialLinks';

export async function getSocialLinks(enabledOnly = false): Promise<SocialLink[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const q = enabledOnly ? query(colRef, where('enabled', '==', true)) : colRef;
    const snapshot = await getDocs(q);
    const list: SocialLink[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({ id: docSnap.id, ...data } as SocialLink);
    });

    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return list;
  } catch (error) {
    console.warn('Social links fetch notice:', error);
    return [];
  }
}

export async function createSocialLink(data: Omit<SocialLink, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
    return docRef.id;
  } catch (error) {
    console.error('Error creating social link:', error);
    throw error;
  }
}

export async function updateSocialLink(id: string, data: Partial<SocialLink>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating social link:', error);
    throw error;
  }
}

export async function deleteSocialLink(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting social link:', error);
    throw error;
  }
}
