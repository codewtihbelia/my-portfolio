import { 
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Skill } from '../types';

const COLLECTION_NAME = 'skills';

export async function getSkills(): Promise<Skill[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const skills: Skill[] = [];
    snapshot.forEach((docSnap) => {
      skills.push({ id: docSnap.id, ...docSnap.data() } as Skill);
    });

    skills.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return skills;
  } catch (error) {
    console.warn('Skills fetch error:', error);
    return [];
  }
}

export async function createSkill(skill: Omit<Skill, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), skill);
    return docRef.id;
  } catch (error) {
    console.error('Error creating skill:', error);
    throw error;
  }
}

export async function updateSkill(id: string, data: Partial<Skill>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating skill:', error);
    throw error;
  }
}

export async function deleteSkill(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting skill:', error);
    throw error;
  }
}
