import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, firebaseReady } from '../services/firebase';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (current) => {
      setUser(current);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = useCallback(async (email, password, displayName) => {
    if (!firebaseReady) throw new Error('Firebase is not configured. Add keys to .env.local');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    return cred.user;
  }, []);

  const login = useCallback(async (email, password) => {
    if (!firebaseReady) throw new Error('Firebase is not configured. Add keys to .env.local');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }, []);

  const logout = useCallback(async () => {
    if (!firebaseReady) return;
    await signOut(auth);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signup, login, logout, firebaseReady }),
    [user, loading, signup, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
