import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signOut
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface AdminEnvConfig {
  envUsername: string;
  envPassword: string;
}

export const getAdminEnvCredentials = (): AdminEnvConfig => {
  const envUsername = (
    import.meta.env.VITE_ADMIN_USERNAME ||
    import.meta.env.VITE_ADMIN_USER ||
    import.meta.env.VITE_ADMIN_EMAIL ||
    'admin'
  ).trim();

  const envPassword = (
    import.meta.env.VITE_ADMIN_PASSWORD ||
    'Admin@123456'
  ).trim();

  return { envUsername, envPassword };
};

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (usernameOrEmail: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<User>;
  loginQuickAdmin: () => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  claimAdminRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  login: async () => {},
  signup: async () => {},
  register: async () => {},
  loginWithGoogle: async () => { throw new Error('Google sign-in is disabled. Use .env administrator credentials.'); },
  loginQuickAdmin: async () => { throw new Error('Instant access is disabled. Use .env administrator credentials.'); },
  logout: async () => {},
  resetPassword: async () => {},
  claimAdminRole: async () => {},
});

const ADMIN_STORAGE_KEY = 'portfolio_admin_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if there is an active local administrator session
    const localSession = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (localSession) {
      try {
        const parsed = JSON.parse(localSession);
        if (parsed?.uid && parsed?.role === 'admin') {
          const restoredUser = {
            uid: parsed.uid,
            email: parsed.email || 'admin@portfolio.local',
            displayName: 'Administrator',
            isAnonymous: false,
          } as unknown as User;

          setUser(restoredUser);
          setIsAdmin(true);
        }
      } catch (e) {
        console.warn('Error reading stored admin session:', e);
        localStorage.removeItem(ADMIN_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (usernameOrEmail: string, pass: string) => {
    const { envUsername, envPassword } = getAdminEnvCredentials();
    const cleanUser = usernameOrEmail.trim();
    const cleanPass = pass.trim();

    // Verify user/email and password against .env configuration
    const isUserValid = 
      cleanUser.toLowerCase() === envUsername.toLowerCase() ||
      (envUsername.includes('@') && cleanUser.toLowerCase() === envUsername.split('@')[0].toLowerCase());

    const isPassValid = cleanPass === envPassword;

    if (!isUserValid || !isPassValid) {
      throw new Error('Invalid administrator username or password. Please verify the credentials configured in your environment (.env).');
    }

    const adminUser = {
      uid: 'env-admin-session',
      email: envUsername.includes('@') ? envUsername : `${envUsername}@portfolio.local`,
      displayName: 'Administrator',
      isAnonymous: false,
    } as unknown as User;

    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify({
      uid: adminUser.uid,
      email: adminUser.email,
      username: envUsername,
      role: 'admin',
      timestamp: Date.now()
    }));

    setUser(adminUser);
    setIsAdmin(true);
  };

  const signup = async () => {
    throw new Error('Self-registration is disabled. Administrator access is strictly controlled via .env.');
  };

  const loginWithGoogle = async () => {
    throw new Error('Google sign-in is disabled. Access is strictly via .env administrator credentials.');
  };

  const loginQuickAdmin = async (): Promise<User> => {
    throw new Error('Instant access is disabled. Access is strictly via .env administrator credentials.');
  };

  const logout = async () => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out note:', e);
    }
    setUser(null);
    setIsAdmin(false);
  };

  const resetPassword = async () => {
    throw new Error('Password reset is not applicable. Please update VITE_ADMIN_PASSWORD in your .env file.');
  };

  const claimAdminRole = async () => {
    setIsAdmin(true);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin,
      loading,
      login,
      signup,
      register: signup,
      loginWithGoogle,
      loginQuickAdmin,
      logout,
      resetPassword,
      claimAdminRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
