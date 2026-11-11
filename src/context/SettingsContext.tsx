import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SiteSettings, Profile } from '../types';
import { getSiteSettings, DEFAULT_SITE_SETTINGS } from '../services/settingsService';
import { getProfile, DEFAULT_PROFILE } from '../services/profileService';
import { seedInitialDatabase } from '../services/seedService';
import { testConnection } from '../lib/firebase';
import { applyBrandColorToDom, getStoredBrandColor } from '../utils/brandTheme';
import { updateAppFavicon } from '../utils/favicon';

interface SettingsContextType {
  settings: SiteSettings;
  siteSettings: SiteSettings;
  profile: Profile | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  reloadSettings: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  reseedDatabase: () => Promise<void>;
  previewBrandColor: (color: string) => void;
  resetBrandColorPreview: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SITE_SETTINGS,
  siteSettings: DEFAULT_SITE_SETTINGS,
  profile: null,
  loading: true,
  refreshSettings: async () => {},
  reloadSettings: async () => {},
  refreshProfile: async () => {},
  reseedDatabase: async () => {},
  previewBrandColor: () => {},
  resetBrandColorPreview: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      testConnection().catch(() => {});
      const [currentSettings, currentProfile] = await Promise.all([
        getSiteSettings(),
        getProfile()
      ]);

      setSettings(currentSettings || DEFAULT_SITE_SETTINGS);
      setProfile(currentProfile || DEFAULT_PROFILE);
    } catch (error) {
      console.warn('Error loading initial site data from Firestore (using defaults):', error);
      setSettings(DEFAULT_SITE_SETTINGS);
      setProfile(DEFAULT_PROFILE);
    } finally {
      setLoading(false);
    }
  }, []);

  // On initial mount, restore any cached brand color immediately to prevent flash
  useEffect(() => {
    applyBrandColorToDom(getStoredBrandColor());
  }, []);

  // Whenever site settings primaryColor changes, re-apply to DOM
  useEffect(() => {
    if (settings.primaryColor) {
      applyBrandColorToDom(settings.primaryColor);
    }
  }, [settings.primaryColor]);

  // Dynamically synchronize the browser tab favicon with the uploaded profile image (or site logo/favicon)
  useEffect(() => {
    const iconToUse = profile?.profileImage || settings.favicon || settings.logo;
    updateAppFavicon(iconToUse);
  }, [profile?.profileImage, settings.favicon, settings.logo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshSettings = async () => {
    const s = await getSiteSettings();
    setSettings(s);
    if (s.primaryColor) {
      applyBrandColorToDom(s.primaryColor);
    }
  };

  const refreshProfile = async () => {
    const p = await getProfile();
    setProfile(p);
  };

  const reseedDatabase = async () => {
    setLoading(true);
    await seedInitialDatabase();
    await loadData();
  };

  const previewBrandColor = (color: string) => {
    applyBrandColorToDom(color);
  };

  const resetBrandColorPreview = () => {
    applyBrandColorToDom(settings.primaryColor || getStoredBrandColor());
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      siteSettings: settings,
      profile,
      loading,
      refreshSettings,
      reloadSettings: loadData,
      refreshProfile,
      reseedDatabase,
      previewBrandColor,
      resetBrandColorPreview
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
