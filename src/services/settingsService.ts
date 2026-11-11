import { 
  collection, doc, getDoc, getDocs, setDoc, query, limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SiteSettings } from '../types';

const COLLECTION_NAME = 'siteSettings';
const MAIN_SETTINGS_ID = 'main_settings';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'Codewithbelia Portfolio',
  siteDescription: 'Professional portfolio of a full-stack developer and digital solutions builder.',
  siteTitle: 'Codewithbelia | Full-Stack Developer & Software Engineer',
  primaryEmail: 'contact@codewithbelia.dev',
  contactEmail: 'contact@codewithbelia.dev',
  location: 'Philippines',
  copyrightText: `© ${new Date().getFullYear()} Codewithbelia. All Rights Reserved.`,
  primaryColor: '#6366f1',
  googleSheetWebhookUrl: (import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL as string) || '',
  notificationEmail: (import.meta.env.VITE_NOTIFICATION_EMAIL as string) || '',
  maintenanceMode: false,
  showBlog: true,
  showServices: true,
  showTestimonials: true,
  showAnalytics: true
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const docRef = doc(db, COLLECTION_NAME, MAIN_SETTINGS_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...DEFAULT_SITE_SETTINGS, ...snap.data() } as SiteSettings;
    }

    // Check if any doc exists
    const q = query(collection(db, COLLECTION_NAME), limit(1));
    const anySnap = await getDocs(q);
    if (!anySnap.empty) {
      const firstDoc = anySnap.docs[0];
      return { id: firstDoc.id, ...DEFAULT_SITE_SETTINGS, ...firstDoc.data() } as SiteSettings;
    }

    return DEFAULT_SITE_SETTINGS;
  } catch (error) {
    console.warn('Site settings fetch notice (using defaults):', error);
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, MAIN_SETTINGS_ID);
    await setDoc(docRef, settings, { merge: true });
  } catch (error) {
    console.error('Error updating site settings:', error);
    throw error;
  }
}
