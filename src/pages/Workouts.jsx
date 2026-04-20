import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { useWorkouts } from '../hooks/useWorkouts';
import Spinner from '../components/Spinner';
import WorkoutForm from '../components/WorkoutForm';
import { WORKOUT_TYPES } from '../services/workoutService';

export default function Workouts() {
  const { workouts, loading, create, edit, remove } = useWorkouts();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleCreate = useCallback(async (data) => {
    await create(data);
    setShowForm(false);
  }, [create]);

  const handleUpdate = useCallback(async (data) => {
    await edit(editing.id, data);
    setEditing(null);
  }, [edit, editing]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await remove(pendingDelete.id);
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(err?.message || 'Could not delete workout.');
    } finally {
      setDeleting(false);
    }
  }, [pendingDelete, deleting, remove]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return workouts.filter((w) => {
      if (filter !== 'all' && w.type !== filter) return false;
      if (!term) return true;
      return (
        w.name.toLowerCase().includes(term) ||
        (w.notes || '').toLowerCase().includes(term)
      );
    });
  }, [workouts, filter, search]);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workouts</h1>
          <p className="text-sm text-ink-500">{workouts.length} total logged</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="btn-primary">
          <Plus className="h-4 w-4" /> New workout
        </button>
      </div>

      {(showForm || editing) && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">{editing ? 'Edit workout' : 'Log a workout'}</h2>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-1 rounded hover:bg-ink-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <WorkoutForm
            initial={editing}
            onSubmit={editing ? handleUpdate : handleCreate}
            submitLabel={editing ? 'Update workout' : 'Save workout'}
          />
        </div>
      )}

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
            <input
              ref={searchRef}
              className="input pl-9 pr-10"
              placeholder='Search by name or notes — press "/" to focus'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd className="hidden sm:inline-flex absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-ink-100 border border-ink-300 text-ink-500 px-1.5 py-0.5 rounded">
              /
            </kbd>
          </div>
          <select className="input sm:w-48" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All types</option>
            {WORKOUT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState onCreate={() => { setShowForm(true); setEditing(null); }} hasWorkouts={workouts.length > 0} />
        ) : (
          <ul className="divide-y divide-ink-300/50">
            {filtered.map((w) => (
              <li key={w.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{w.name}</p>
                    <span className="text-[10px] uppercase tracking-wide bg-ink-100 text-ink-700 px-2 py-0.5 rounded-full flex-shrink-0">
                      {w.type}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {format(new Date(w.performedAt), 'MMM d, yyyy')} · {w.durationMinutes} min · {w.caloriesBurned} kcal
                    {w.sets > 0 ? ` · ${w.sets}×${w.reps}` : ''}
                  </p>
                  {w.notes && <p className="text-xs text-ink-700 mt-1 italic truncate">"{w.notes}"</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => { setEditing(w); setShowForm(false); }} className="p-2 rounded hover:bg-ink-100" title="Edit">
                    <Pencil className="h-4 w-4 text-ink-700" />
                  </button>
                  <button onClick={() => { setPendingDelete(w); setDeleteError(''); }} className="p-2 rounded hover:bg-red-50" title="Delete">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-30 bg-ink-900/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="card max-w-sm w-full">
            <h3 className="font-semibold mb-1">Delete this workout?</h3>
            <p className="text-sm text-ink-500 mb-4">
              "{pendingDelete.name}" from {format(new Date(pendingDelete.performedAt), 'MMM d, yyyy')} will be removed. This cannot be undone.
            </p>
            {deleteError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setPendingDelete(null); setDeleteError(''); }}
                disabled={deleting}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting} className="btn-danger">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onCreate, hasWorkouts }) {
  return (
    <div className="text-center py-10">
      <p className="text-ink-500 mb-3">
        {hasWorkouts ? 'No workouts match your filters.' : 'You have not logged any workouts yet.'}
      </p>
      {!hasWorkouts && (
        <button onClick={onCreate} className="btn-primary">
          <Plus className="h-4 w-4" /> Log your first workout
        </button>
      )}
    </div>
  );
}
