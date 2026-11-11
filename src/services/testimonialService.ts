import { 
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Testimonial } from '../types';

const COLLECTION_NAME = 'testimonials';

export async function getTestimonials(approvedOnly = true): Promise<Testimonial[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const q = approvedOnly ? query(colRef, where('approved', '==', true)) : colRef;
    const snapshot = await getDocs(q);
    const list: Testimonial[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({ id: docSnap.id, ...data } as Testimonial);
    });

    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return list;
  } catch (error) {
    console.warn('Testimonials fetch notice:', error);
    return [];
  }
}

export async function createTestimonial(data: Omit<Testimonial, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
    return docRef.id;
  } catch (error) {
    console.error('Error creating testimonial:', error);
    throw error;
  }
}

export async function updateTestimonial(id: string, data: Partial<Testimonial>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating testimonial:', error);
    throw error;
  }
}

export async function deleteTestimonial(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    throw error;
  }
}
