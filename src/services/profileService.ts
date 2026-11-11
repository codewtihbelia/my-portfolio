import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, query, limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Profile } from '../types';

const COLLECTION_NAME = 'profiles';
const MAIN_PROFILE_ID = 'main_profile';

export const DEFAULT_PROFILE: Profile = {
  id: 'main_profile',
  name: 'Codewithbelia',
  professionalTitle: 'Full-Stack Developer & Software Engineer',
  shortIntroduction: 'I design and develop modern, scalable, and user-focused digital solutions.',
  biography: 'I am a passionate full-stack developer focused on transforming real-world problems into practical digital solutions. I enjoy designing intuitive interfaces, building reliable backend systems, and creating technology that delivers meaningful value to its users.',
  location: 'Philippines',
  email: 'contact@codewithbelia.dev',
  phone: '',
  availability: 'Available for projects',
  availabilityMessage: 'Currently accepting freelance projects, contract engagements, and engineering roles.',
  yearsOfExperience: '3+',
  resumeUrl: '',
  githubUrl: 'https://github.com/codewithbelia',
  linkedinUrl: 'https://linkedin.com/in/codewithbelia',
  websiteUrl: 'https://codewithbelia.dev',
  profileImage: '',
  coverImage: '',
  updatedAt: new Date().toISOString()
};

export async function getProfile(): Promise<Profile | null> {
  try {
    const mainDocRef = doc(db, COLLECTION_NAME, MAIN_PROFILE_ID);
    const mainSnapshot = await getDoc(mainDocRef);
    
    if (mainSnapshot.exists()) {
      return { id: mainSnapshot.id, ...mainSnapshot.data() } as Profile;
    }

    // Fallback: check if any profile document exists in the collection
    const q = query(collection(db, COLLECTION_NAME), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as Profile;
    }

    return null;
  } catch (error) {
    console.warn('Profile fetch warning:', error);
    return null;
  }
}

export async function updateProfile(profileData: Partial<Profile>): Promise<void> {
  try {
    const profileRef = doc(db, COLLECTION_NAME, MAIN_PROFILE_ID);
    await setDoc(profileRef, {
      ...profileData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating profile in Firestore:', error);
    throw error;
  }
}
