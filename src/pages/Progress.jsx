import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { useWorkouts } from '../hooks/useWorkouts';
import { useProfile } from '../hooks/useProfile';
import { summarizeWorkouts, toDailySeries, toTypeBreakdown } from '../utils/stats';
import Spinner from '../components/Spinner';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];

export default function Progress() {
  const { workouts, loading } = useWorkouts();
  const { profile } = useProfile();

  const stats = useMemo(() => summarizeWorkouts(workouts, profile), [workouts, profile]);
  const dailySeries = useMemo(() => toDailySeries(workouts, 14), [workouts]);
  const breakdown = useMemo(() => toTypeBreakdown(workouts), [workouts]);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-sm text-ink-500">Trends from your logged workouts.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total workouts" value={stats.totalWorkouts} />
        <Stat label="This week" value={stats.weekCount} sub={`${stats.prevWeekCount} last week`} />
        <Stat label="Minutes (week)" value={stats.weekMinutes} />
        <Stat label="Calories (week)" value={stats.weekCalories} />
      </div>

      {workouts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-ink-500">Log some workouts to see your charts light up.</p>
        </div>
      ) : (
        <>
          <div className="card">
            <h2 className="font-semibold mb-3">Minutes trained — last 14 days</h2>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={dailySeries}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="minutes" stroke="#10b981" fill="url(#g1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="card">
              <h2 className="font-semibold mb-3">Calories burned — last 14 days</h2>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={dailySeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="calories" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <h2 className="font-semibold mb-3">Workout type mix</h2>
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={breakdown}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      label={(entry) => entry.label}
                    >
                      {breakdown.map((entry, i) => (
                        <Cell key={entry.type} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="card">
      <p className="text-xs text-ink-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-[11px] text-ink-500 mt-0.5">{sub}</p>}
    </div>
  );
}
