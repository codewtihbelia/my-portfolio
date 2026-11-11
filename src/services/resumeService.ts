import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Resume } from '../types';

const COLLECTION_NAME = 'resume';

export async function getActiveResume(): Promise<Resume | null> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where('active', '==', true), limit(1));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data,
        active: true,
        isDefault: true
      } as Resume;
    }

    // Fallback: Check if any document has isDefault == true
    const qDefault = query(colRef, where('isDefault', '==', true), limit(1));
    const snapDefault = await getDocs(qDefault);
    if (!snapDefault.empty) {
      const docSnap = snapDefault.docs[0];
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data,
        active: true,
        isDefault: true
      } as Resume;
    }

    // Fallback: Check if any resumes exist at all in collection
    const all = await getResumes();
    if (all.length > 0) {
      return all[0];
    }

    return null;
  } catch (error) {
    console.warn('Notice loading active resume:', error);
    return null;
  }
}

export async function getResumes(): Promise<Resume[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const list: Resume[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const isAct = Boolean(data.active ?? data.isDefault ?? false);
      list.push({ 
        id: docSnap.id, 
        ...data,
        active: isAct,
        isDefault: isAct
      } as Resume);
    });

    list.sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));
    return list;
  } catch (error) {
    console.warn('Notice loading resume list:', error);
    return [];
  }
}

export async function createResume(data: Omit<Resume, 'id'>): Promise<string> {
  try {
    const isAct = Boolean(data.active ?? (data as any).isDefault ?? false);
    const finalData = { 
      ...data, 
      active: isAct,
      isDefault: isAct,
      uploadedAt: data.uploadedAt || new Date().toISOString().split('T')[0]
    };

    // If setting active, deactivate existing ones first
    if (isAct) {
      const currentActive = await getResumes();
      for (const res of currentActive) {
        if (res.active || res.isDefault) {
          try {
            await updateDoc(doc(db, COLLECTION_NAME, res.id), { 
              active: false, 
              isDefault: false 
            });
          } catch (e) {
            console.warn('Notice deactivating resume:', e);
          }
        }
      }
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), finalData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating resume record:', error);
    throw error;
  }
}

export async function updateResume(id: string, data: Partial<Resume>): Promise<void> {
  try {
    if (data.active || data.isDefault) {
      const all = await getResumes();
      for (const r of all) {
        if (r.id !== id && (r.active || r.isDefault)) {
          await updateDoc(doc(db, COLLECTION_NAME, r.id), { active: false, isDefault: false });
        }
      }
    }

    await updateDoc(doc(db, COLLECTION_NAME, id), data);
  } catch (error) {
    console.error('Error updating resume:', error);
    throw error;
  }
}

export async function setActiveResume(id: string): Promise<void> {
  try {
    const all = await getResumes();
    for (const r of all) {
      const isTarget = r.id === id;
      try {
        await updateDoc(doc(db, COLLECTION_NAME, r.id), { 
          active: isTarget,
          isDefault: isTarget 
        });
      } catch (err) {
        console.warn(`Notice updating active resume ${r.id}:`, err);
      }
    }
  } catch (error) {
    console.error('Error setting active resume:', error);
    throw error;
  }
}

export const setDefaultResume = setActiveResume;

export async function incrementResumeDownload(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const current = snap.data().downloadCount || 0;
      await updateDoc(docRef, { downloadCount: current + 1 });
    }
  } catch (error) {
    console.error('Error incrementing download count:', error);
  }
}

export async function deleteResume(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting resume:', error);
    throw error;
  }
}

