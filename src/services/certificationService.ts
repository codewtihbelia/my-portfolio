import { 
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Certification } from '../types';

const COLLECTION_NAME = 'certifications';

export async function getCertifications(): Promise<Certification[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const list: Certification[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Certification);
    });
    // Sort by issueDate descending
    list.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
    return list;
  } catch (error) {
    console.warn('Certifications fetch notice (using fallback):', error);
    return [];
  }
}

export async function createCertification(data: Omit<Certification, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
    return docRef.id;
  } catch (error) {
    console.error('Error creating certification:', error);
    throw error;
  }
}

export async function updateCertification(id: string, data: Partial<Certification>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating certification:', error);
    throw error;
  }
}

export async function deleteCertification(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting certification:', error);
    throw error;
  }
}
