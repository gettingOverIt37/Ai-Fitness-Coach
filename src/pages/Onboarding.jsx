import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { GOAL_OPTIONS, LEVEL_OPTIONS, EQUIPMENT_OPTIONS } from '../utils/stats';

export default function Onboarding() {
  const { profile, savePatch } = useProfile();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    goal: profile.goal,
    fitnessLevel: profile.fitnessLevel,
    equipment: profile.equipment,
    daysPerWeek: profile.daysPerWeek || 3,
  });
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await savePatch({ ...form, onboarded: true });
      navigate('/coach');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-brand-50 to-ink-100">
      <form onSubmit={handleSubmit} className="card w-full max-w-lg space-y-5">
        <div className="text-center">
          <Sparkles className="h-8 w-8 text-brand-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold">Tell us about you</h1>
          <p className="text-sm text-ink-500">A few details so your coach can build the right plan.</p>
        </div>

        <Field label="What's your main goal?">
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
          <input
            type="number"
            min={2}
            max={6}
            className="input"
            value={form.daysPerWeek}
            onChange={update('daysPerWeek')}
          />
        </Field>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving...' : 'Generate my plan'}
        </button>
      </form>
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
