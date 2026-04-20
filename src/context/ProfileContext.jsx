import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';
import {
  DEFAULT_PROFILE,
  createUserProfile,
  subscribeUserProfile,
  updateUserProfile,
} from '../services/profileService';
import { auth, firebaseReady } from '../services/firebase';

export const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setProfile(DEFAULT_PROFILE);
      setLoading(false);
      setError(null);
      return () => {};
    }

    let active = true;
    let unsubscribe = () => {};

    async function connect() {
      setLoading(true);
      setError(null);
      try {
        if (firebaseReady) {
          await createUserProfile(user.uid, {
            displayName: user.displayName || '',
            email: user.email || '',
          });
        }

        unsubscribe = subscribeUserProfile(
          user.uid,
          (data) => {
            if (!active) return;
            setProfile(data);
            setLoading(false);
          },
          (err) => {
            if (!active) return;
            setError(err?.message || 'Failed to load profile');
            setLoading(false);
          },
        );
      } catch (err) {
        if (!active) return;
        setError(err?.message || 'Failed to load profile');
        setLoading(false);
      }
    }

    connect();
    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  const savePatch = useCallback(async (patch) => {
    if (!user) return;
    const previous = profile;
    setProfile((prev) => ({ ...prev, ...patch }));
    setError(null);
    try {
      if (
        patch.displayName &&
        auth?.currentUser &&
        auth.currentUser.uid === user.uid &&
        patch.displayName !== auth.currentUser.displayName
      ) {
        await updateAuthProfile(auth.currentUser, { displayName: patch.displayName });
      }
      await updateUserProfile(user.uid, patch);
    } catch (err) {
      setProfile(previous);
      setError(err?.message || 'Failed to save profile');
      throw err;
    }
  }, [user, profile]);

  const value = useMemo(
    () => ({ profile, loading, error, savePatch }),
    [profile, loading, error, savePatch],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
