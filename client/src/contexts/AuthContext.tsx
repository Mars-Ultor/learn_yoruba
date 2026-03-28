import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import api, { usersApi } from '../services/api';

interface CheckInResult {
  streak: number;
  streakReset: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  lastCheckIn: CheckInResult | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheckIn, setLastCheckIn] = useState<CheckInResult | null>(null);

  const runCheckIn = useCallback(async () => {
    try {
      const res = await usersApi.checkIn();
      setLastCheckIn(res.data as CheckInResult);
    } catch {
      // Non-fatal: check-in failure shouldn't break the app
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        // Run check-in after every auth state resolution (login or page reload)
        runCheckIn();
      }
    });
    return unsubscribe;
  }, [runCheckIn]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged fires next, which triggers runCheckIn
  };

  const register = async (email: string, password: string, username: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await api.post('/users/register', {
      uid: credential.user.uid,
      email: credential.user.email,
      username,
    });
  };

  const logout = async () => {
    await signOut(auth);
    setLastCheckIn(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, lastCheckIn, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
