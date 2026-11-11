import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  Firestore, 
  doc, 
  getDoc,
  setLogLevel 
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';

// Silence internal Firestore SDK reconnection and timeout warnings from polluting console
setLogLevel('silent');

// Determine whether custom environment variables are provided (e.g. personal Firebase project)
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (process.env || {});

const isCustomConfigured = Boolean(
  env.VITE_FIREBASE_PROJECT_ID && 
  env.VITE_FIREBASE_API_KEY && 
  env.VITE_FIREBASE_PROJECT_ID !== 'gen-lang-client-0282545714'
);

// Firebase configuration: prioritizes custom project when configured by user, otherwise uses workspace applet config
export const firebaseConfig = isCustomConfigured
  ? {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: env.VITE_FIREBASE_APP_ID || '',
    }
  : {
      apiKey: firebaseConfigData.apiKey,
      authDomain: firebaseConfigData.authDomain,
      projectId: firebaseConfigData.projectId,
      storageBucket: firebaseConfigData.storageBucket,
      messagingSenderId: firebaseConfigData.messagingSenderId,
      appId: firebaseConfigData.appId,
    };

export const databaseId: string | undefined = isCustomConfigured
  ? (env.VITE_FIREBASE_DATABASE_ID || undefined)
  : (firebaseConfigData.firestoreDatabaseId || undefined);

export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

function initDb(): Firestore {
  try {
    return (databaseId && databaseId !== '(default)')
      ? initializeFirestore(app, { ignoreUndefinedProperties: true }, databaseId)
      : initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    return (databaseId && databaseId !== '(default)') 
      ? getFirestore(app, databaseId) 
      : getFirestore(app);
  }
}

// Initialize Firestore directly bound to the project database with ignoreUndefinedProperties
export const db: Firestore = initDb();

export const storage: FirebaseStorage = getStorage(app);

// Connection test as required by Firebase skill (graceful offline handling)
export async function testConnection(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'profiles', 'test_conn'));
    return snap.exists();
  } catch {
    return false;
  }
}
