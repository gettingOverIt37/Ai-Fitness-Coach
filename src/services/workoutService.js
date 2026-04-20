import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { sortWorkoutsByPerformedAtDesc } from '../utils/workoutSort';

const COLLECTION = 'workouts';

function toWorkout(docSnap) {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    performedAt: data.performedAt?.toDate ? data.performedAt.toDate() : data.performedAt,
  };
}

export async function listWorkouts(uid) {
  if (!db) return [];
  const q = query(collection(db, COLLECTION), where('uid', '==', uid));
  const snap = await getDocs(q);
  return sortWorkoutsByPerformedAtDesc(snap.docs.map(toWorkout));
}

export function subscribeToWorkouts(uid, onChange, onError) {
  if (!db) {
    onChange([]);
    return () => {};
  }

  const q = query(collection(db, COLLECTION), where('uid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      onChange(sortWorkoutsByPerformedAtDesc(snap.docs.map(toWorkout)));
    },
    onError,
  );
}

async function assertWorkoutOwnership(id, uid) {
  if (!db) throw new Error('Firebase not configured');
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) throw new Error('Workout not found');
  if (snap.data().uid !== uid) throw new Error('Not authorized to modify this workout');
}

export async function addWorkout(uid, workout) {
  if (!db) throw new Error('Firebase not configured');
  const ref = await addDoc(collection(db, COLLECTION), {
    uid,
    type: workout.type,
    name: workout.name,
    durationMinutes: Number(workout.durationMinutes) || 0,
    caloriesBurned: Number(workout.caloriesBurned) || 0,
    sets: Number(workout.sets) || 0,
    reps: Number(workout.reps) || 0,
    notes: workout.notes || '',
    performedAt: workout.performedAt ? new Date(workout.performedAt) : new Date(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateWorkout(uid, id, patch) {
  if (!db) throw new Error('Firebase not configured');
  await assertWorkoutOwnership(id, uid);
  const clean = { ...patch };
  delete clean.uid;
  if (clean.performedAt) clean.performedAt = new Date(clean.performedAt);
  if (clean.durationMinutes !== undefined)
    clean.durationMinutes = Number(clean.durationMinutes) || 0;
  if (clean.caloriesBurned !== undefined)
    clean.caloriesBurned = Number(clean.caloriesBurned) || 0;
  if (clean.sets !== undefined) clean.sets = Number(clean.sets) || 0;
  if (clean.reps !== undefined) clean.reps = Number(clean.reps) || 0;
  await updateDoc(doc(db, COLLECTION, id), { ...clean, updatedAt: serverTimestamp() });
}

export async function deleteWorkout(uid, id) {
  if (!db) throw new Error('Firebase not configured');
  await assertWorkoutOwnership(id, uid);
  await deleteDoc(doc(db, COLLECTION, id));
}

export const WORKOUT_TYPES = [
  { id: 'strength', label: 'Strength' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'hiit', label: 'HIIT' },
  { id: 'yoga', label: 'Yoga / Mobility' },
  { id: 'sport', label: 'Sport' },
  { id: 'walk', label: 'Walk / Run' },
];
