import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const DEFAULT_PROFILE = {
  displayName: '',
  email: '',
  goal: 'general_fitness',
  fitnessLevel: 'beginner',
  weightKg: null,
  heightCm: null,
  age: null,
  equipment: 'bodyweight',
  daysPerWeek: 3,
  onboarded: false,
};

export async function createUserProfile(uid, patch) {
  if (!db) return;
  await setDoc(
    doc(db, 'users', uid),
    { ...DEFAULT_PROFILE, ...patch, createdAt: serverTimestamp() },
    { merge: true },
  );
}

export async function getUserProfile(uid) {
  if (!db) return DEFAULT_PROFILE;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return DEFAULT_PROFILE;
  return { ...DEFAULT_PROFILE, ...snap.data() };
}

export async function updateUserProfile(uid, patch) {
  if (!db) return;
  await setDoc(
    doc(db, 'users', uid),
    { ...patch, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export function subscribeUserProfile(uid, onChange, onError) {
  if (!db) {
    onChange(DEFAULT_PROFILE);
    return () => {};
  }

  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (!snap.exists()) {
        onChange(DEFAULT_PROFILE);
        return;
      }
      onChange({ ...DEFAULT_PROFILE, ...snap.data() });
    },
    onError,
  );
}

export { DEFAULT_PROFILE };
