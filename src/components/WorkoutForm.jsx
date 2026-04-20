import { useState } from 'react';
import { WORKOUT_TYPES } from '../services/workoutService';

const EMPTY = {
  type: 'strength',
  name: '',
  durationMinutes: 30,
  caloriesBurned: 200,
  sets: 3,
  reps: 10,
  notes: '',
  performedAt: new Date().toISOString().slice(0, 10),
};

export default function WorkoutForm({ initial, onSubmit, submitLabel = 'Save' }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...toFormShape(initial) }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Please name this workout.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err?.message || 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Field label="Workout name" className="md:col-span-2">
        <input
          required
          className="input"
          value={form.name}
          onChange={update('name')}
          placeholder="Morning leg day, evening run..."
        />
      </Field>
      <Field label="Type">
        <select className="input" value={form.type} onChange={update('type')}>
          {WORKOUT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </Field>
      <Field label="Date">
        <input type="date" className="input" value={form.performedAt} onChange={update('performedAt')} />
      </Field>
      <Field label="Duration (minutes)">
        <input type="number" min={1} max={600} className="input" value={form.durationMinutes} onChange={update('durationMinutes')} />
      </Field>
      <Field label="Calories burned">
        <input type="number" min={0} max={5000} className="input" value={form.caloriesBurned} onChange={update('caloriesBurned')} />
      </Field>
      <Field label="Sets">
        <input type="number" min={0} max={50} className="input" value={form.sets} onChange={update('sets')} />
      </Field>
      <Field label="Reps">
        <input type="number" min={0} max={1000} className="input" value={form.reps} onChange={update('reps')} />
      </Field>
      <Field label="Notes" className="md:col-span-2">
        <textarea rows={2} className="input" value={form.notes} onChange={update('notes')} placeholder="How did it feel? PRs? Energy level?" />
      </Field>
      {error && (
        <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <div className="md:col-span-2 flex justify-end">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({ label, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function toFormShape(initial) {
  if (!initial) return {};
  return {
    ...initial,
    performedAt: initial.performedAt
      ? new Date(initial.performedAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  };
}
