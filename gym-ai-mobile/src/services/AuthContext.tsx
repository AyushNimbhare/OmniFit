import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService, setAuthToken } from './api';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, isFirebaseEnabled } from './firebase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string, name?: string) => Promise<void>;
  register: (name: string, email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isFirebaseEnabled && auth) {
      // Real Firebase State Observer
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const userUid = firebaseUser.uid;
            const email = firebaseUser.email || '';
            const name = firebaseUser.displayName || email.split('@')[0];
            
            // Sync with backend database
            const syncedUser = await authService.syncUser(email, name, userUid);
            
            setToken(userUid);
            setAuthToken(userUid);
            setUser(syncedUser);
            
            if (typeof window !== 'undefined') {
              localStorage.setItem('gym_ai_token', userUid);
              localStorage.setItem('gym_ai_user', JSON.stringify(syncedUser));
            }
          } catch (e) {
            console.error('Firebase session sync failed:', e);
          }
        } else {
          // Cleared session
          setToken(null);
          setAuthToken(null);
          setUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('gym_ai_token');
            localStorage.removeItem('gym_ai_user');
          }
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local Bypass Restore session from localStorage on Web
      try {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('gym_ai_token') : null;
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('gym_ai_user') : null;
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setAuthToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.warn('Failed to load auth session:', e);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const login = async (email: string, password?: string, name?: string) => {
    setIsLoading(true);
    try {
      if (isFirebaseEnabled && auth) {
        // Real Firebase login
        if (!password) {
          throw new Error('Password is required for Firebase Authentication.');
        }
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const firebaseUser = userCredential.user;
        const syncedUser = await authService.syncUser(
          firebaseUser.email || email, 
          firebaseUser.displayName || name || email.split('@')[0], 
          firebaseUser.uid
        );
        
        setToken(firebaseUser.uid);
        setAuthToken(firebaseUser.uid);
        setUser(syncedUser);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('gym_ai_token', firebaseUser.uid);
          localStorage.setItem('gym_ai_user', JSON.stringify(syncedUser));
        }
      } else {
        // Local Bypass Auth mode
        const cleanName = (name || email.split('@')[0]).trim().replace(/\s+/g, '_');
        const cleanEmail = email.trim().replace(/@/g, '_at_').replace(/\./g, '_dot_');
        const bypassToken = `bypass-${cleanName}-${cleanEmail}`;

        const syncedUser = await authService.syncUser(email.trim(), name || email.split('@')[0], bypassToken);
        
        setToken(bypassToken);
        setAuthToken(bypassToken);
        setUser(syncedUser);

        if (typeof window !== 'undefined') {
          localStorage.setItem('gym_ai_token', bypassToken);
          localStorage.setItem('gym_ai_user', JSON.stringify(syncedUser));
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Authentication failed. Please verify credentials/backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password?: string) => {
    setIsLoading(true);
    try {
      if (isFirebaseEnabled && auth) {
        if (!password) {
          throw new Error('Password is required for Firebase Authentication.');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const firebaseUser = userCredential.user;
        
        // Update display name in Firebase Auth
        await updateProfile(firebaseUser, { displayName: name });
        
        // Sync with backend
        const syncedUser = await authService.syncUser(email.trim(), name, firebaseUser.uid);
        
        setToken(firebaseUser.uid);
        setAuthToken(firebaseUser.uid);
        setUser(syncedUser);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('gym_ai_token', firebaseUser.uid);
          localStorage.setItem('gym_ai_user', JSON.stringify(syncedUser));
        }
      } else {
        // Local Bypass Mode
        await login(email, undefined, name);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      if (isFirebaseEnabled && auth) {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;
        const syncedUser = await authService.syncUser(
          firebaseUser.email || '', 
          firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Google User', 
          firebaseUser.uid
        );
        
        setToken(firebaseUser.uid);
        setAuthToken(firebaseUser.uid);
        setUser(syncedUser);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('gym_ai_token', firebaseUser.uid);
          localStorage.setItem('gym_ai_user', JSON.stringify(syncedUser));
        }
      } else {
        // Local Bypass Google Login
        const bypassToken = `bypass-Google_User-google_at_example_dot_com`;
        const syncedUser = await authService.syncUser('google@example.com', 'Google User', bypassToken);
        
        setToken(bypassToken);
        setAuthToken(bypassToken);
        setUser(syncedUser);

        if (typeof window !== 'undefined') {
          localStorage.setItem('gym_ai_token', bypassToken);
          localStorage.setItem('gym_ai_user', JSON.stringify(syncedUser));
        }
      }
    } catch (error: any) {
      console.error('Google Login error:', error);
      throw new Error(error.message || 'Google Sign-In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (isFirebaseEnabled && auth) {
        await signOut(auth);
      } else {
        setToken(null);
        setAuthToken(null);
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('gym_ai_token');
          localStorage.removeItem('gym_ai_user');
        }
      }
    } catch (e) {
      console.warn('Failed during sign out:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
