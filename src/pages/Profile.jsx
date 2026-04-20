import { useEffect, useState } from 'react';
import { Save, Check } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { GOAL_OPTIONS, LEVEL_OPTIONS, EQUIPMENT_OPTIONS } from '../utils/stats';
import Spinner from '../components/Spinner';

function buildForm(profile, user) {
  return {
    displayName: profile.displayName || user?.displayName || '',
    goal: profile.goal,
    fitnessLevel: profile.fitnessLevel,
    equipment: profile.equipment,
    daysPerWeek: profile.daysPerWeek || 3,
    weightKg: profile.weightKg ?? '',
    heightCm: profile.heightCm ?? '',
    age: profile.age ?? '',
  };
}

export default function Profile() {
  const { profile, savePatch, loading } = useProfile();
  const { user } = useAuth();
  const [form, setForm] = useState(() => buildForm(profile, user));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(buildForm(profile, user));
  }, [profile, user]);

  const update = (key) => (e) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await savePatch({
        displayName: form.displayName,
        goal: form.goal,
        fitnessLevel: form.fitnessLevel,
        equipment: form.equipment,
        daysPerWeek: Number(form.daysPerWeek) || 3,
        weightKg: form.weightKg === '' ? null : Number(form.weightKg),
        heightCm: form.heightCm === '' ? null : Number(form.heightCm),
        age: form.age === '' ? null : Number(form.age),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Profile</h1>
      <p className="text-sm text-ink-500 mb-5">These details personalize your AI plan.</p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <Field label="Display name">
          <input required className="input" value={form.displayName} onChange={update('displayName')} />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Goal">
            <select className="input" value={form.goal} onChange={update('goal')}>
              {GOAL_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Fitness level">
            <select className="input" value={form.fitnessLevel} onChange={update('fitnessLevel')}>
              {LEVEL_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Equipment">
            <select className="input" value={form.equipment} onChange={update('equipment')}>
              {EQUIPMENT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Days per week">
            <input type="number" min={2} max={6} className="input" value={form.daysPerWeek} onChange={update('daysPerWeek')} />
          </Field>
          <Field label="Weight (kg)">
            <input type="number" min={30} max={250} className="input" value={form.weightKg} onChange={update('weightKg')} placeholder="Optional" />
          </Field>
          <Field label="Height (cm)">
            <input type="number" min={100} max={230} className="input" value={form.heightCm} onChange={update('heightCm')} placeholder="Optional" />
          </Field>
          <Field label="Age">
            <input type="number" min={13} max={100} className="input" value={form.age} onChange={update('age')} placeholder="Optional" />
          </Field>
        </div>

        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="text-sm text-brand-700 inline-flex items-center gap-1">
              <Check className="h-4 w-4" /> Saved
            </span>
          ) : <span />}
          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>

      <div className="mt-4 text-xs text-ink-500">
        Signed in as {user?.email}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
