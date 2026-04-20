import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import {
  addWorkout,
  deleteWorkout,
  listWorkouts,
  subscribeToWorkouts,
  updateWorkout,
} from '../services/workoutService';

export function useWorkouts() {
  const { user } = useAuth();
  const uid = user?.uid || null;
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!uid) {
      if (mounted.current) {
        setWorkouts([]);
        setLoading(false);
      }
      return;
    }
    if (mounted.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await listWorkouts(uid);
      if (mounted.current) setWorkouts(data);
    } catch (err) {
      if (mounted.current) setError(err?.message || 'Failed to load workouts');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      setWorkouts([]);
      setLoading(false);
      setError(null);
      return () => {};
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToWorkouts(
      uid,
      (data) => {
        if (!mounted.current) return;
        setWorkouts(data);
        setLoading(false);
      },
      async (err) => {
        if (!mounted.current) return;
        setError(err?.message || 'Failed to load workouts');
        try {
          const data = await listWorkouts(uid);
          if (!mounted.current) return;
          setWorkouts(data);
        } catch (fallbackErr) {
          if (!mounted.current) return;
          setError(fallbackErr?.message || err?.message || 'Failed to load workouts');
        } finally {
          if (mounted.current) setLoading(false);
        }
      },
    );

    return unsubscribe;
  }, [uid]);

  const create = useCallback(async (workout) => {
    if (!uid) return;
    await addWorkout(uid, workout);
  }, [uid]);

  const edit = useCallback(async (id, patch) => {
    if (!uid) return;
    if (!workouts.some((w) => w.id === id)) {
      throw new Error('Workout not found in your list');
    }
    await updateWorkout(uid, id, patch);
  }, [uid, workouts]);

  const remove = useCallback(async (id) => {
    if (!uid) return;
    if (!workouts.some((w) => w.id === id)) {
      throw new Error('Workout not found in your list');
    }
    await deleteWorkout(uid, id);
  }, [uid, workouts]);

  return { workouts, loading, error, refresh, create, edit, remove };
}
