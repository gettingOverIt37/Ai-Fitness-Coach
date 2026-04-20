import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Flame, Timer, TrendingUp, Trophy, Sparkles, Plus } from 'lucide-react';
import { useWorkouts } from '../hooks/useWorkouts';
import { useProfile } from '../hooks/useProfile';
import { summarizeWorkouts } from '../utils/stats';
import { generateInsight } from '../services/aiCoachService';
import Spinner from '../components/Spinner';
import WorkoutForm from '../components/WorkoutForm';

export default function Dashboard() {
  const { workouts, loading, create } = useWorkouts();
  const { profile } = useProfile();
  const [insight, setInsight] = useState('');
  const [quickOpen, setQuickOpen] = useState(false);

  const stats = useMemo(() => summarizeWorkouts(workouts, profile), [workouts, profile]);

  useEffect(() => {
    let active = true;
    generateInsight(stats)
      .then((text) => { if (active) setInsight(text); })
      .catch(() => { if (active) setInsight('Log a workout to start your streak.'); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stats.totalWorkouts,
    stats.weekCount,
    stats.prevWeekCount,
    stats.weekMinutes,
    stats.topType,
    stats.goal,
  ]);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Hey {profile.displayName?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-ink-500 text-sm">{format(new Date(), 'EEEE, MMM d')}</p>
        </div>
        <button onClick={() => setQuickOpen((v) => !v)} className="btn-primary">
          <Plus className="h-4 w-4" />
          {quickOpen ? 'Close' : 'Quick log'}
        </button>
      </div>

      {quickOpen && (
        <div className="card">
          <h2 className="font-semibold mb-4">Log a workout</h2>
          <WorkoutForm
            onSubmit={async (data) => {
              await create(data);
              setQuickOpen(false);
            }}
            submitLabel="Save workout"
          />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Trophy} label="Total workouts" value={stats.totalWorkouts} accent="text-brand-600" />
        <StatCard icon={Timer} label="Minutes this week" value={stats.weekMinutes} accent="text-blue-600" />
        <StatCard icon={Flame} label="Calories this week" value={stats.weekCalories} accent="text-orange-500" />
        <StatCard icon={TrendingUp} label="Current streak" value={`${stats.streakDays} day${stats.streakDays === 1 ? '' : 's'}`} accent="text-purple-600" />
      </div>

      <div className="card">
        <div className="flex items-start gap-3">
          <div className="bg-brand-50 rounded-full p-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h2 className="font-semibold">Your AI coach</h2>
            <p className="text-sm text-ink-700 mt-1">
              {insight || 'Generating a personalized insight...'}
            </p>
            <Link to="/coach" className="text-sm text-brand-600 font-medium mt-2 inline-block hover:underline">
              Open full plan →
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Recent workouts</h2>
          <Link to="/workouts" className="text-sm text-brand-600 hover:underline">See all</Link>
        </div>
        {workouts.length === 0 ? (
          <p className="text-sm text-ink-500">No workouts yet. Log your first one above.</p>
        ) : (
          <ul className="divide-y divide-ink-300/50">
            {workouts.slice(0, 5).map((w) => (
              <li key={w.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{w.name}</p>
                  <p className="text-xs text-ink-500">
                    {format(new Date(w.performedAt), 'MMM d')} · {w.durationMinutes} min · {w.caloriesBurned} kcal
                  </p>
                </div>
                <span className="text-xs uppercase tracking-wide bg-ink-100 text-ink-700 px-2 py-1 rounded-full">
                  {w.type}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="card">
      <Icon className={`h-5 w-5 ${accent} mb-2`} />
      <p className="text-xs text-ink-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
