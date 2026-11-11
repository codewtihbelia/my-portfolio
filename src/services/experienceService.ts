import { 
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Experience } from '../types';

const COLLECTION_NAME = 'experiences';

export async function getExperiences(): Promise<Experience[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const list: Experience[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Experience);
    });

    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return list;
  } catch (error) {
    console.warn('Experiences fetch error:', error);
    return [];
  }
}

export async function createExperience(data: Omit<Experience, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
    return docRef.id;
  } catch (error) {
    console.error('Error creating experience:', error);
    throw error;
  }
}

export async function updateExperience(id: string, data: Partial<Experience>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating experience:', error);
    throw error;
  }
}

export async function deleteExperience(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting experience:', error);
    throw error;
  }
}
