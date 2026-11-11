import { 
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Education } from '../types';

const COLLECTION_NAME = 'education';

export async function getEducation(): Promise<Education[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const list: Education[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Education);
    });
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return list;
  } catch (error) {
    console.warn('Education fetch notice (using fallback):', error);
    return [];
  }
}

export async function createEducation(data: Omit<Education, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
    return docRef.id;
  } catch (error) {
    console.error('Error creating education:', error);
    throw error;
  }
}

export async function updateEducation(id: string, data: Partial<Education>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating education:', error);
    throw error;
  }
}

export async function deleteEducation(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting education:', error);
    throw error;
  }
}
