import { format, startOfWeek, endOfWeek, subDays, isWithinInterval, startOfDay } from 'date-fns';

export function summarizeWorkouts(workouts, profile) {
  if (!workouts?.length) {
    return {
      totalWorkouts: 0,
      weekCount: 0,
      prevWeekCount: 0,
      weekMinutes: 0,
      weekCalories: 0,
      streakDays: 0,
      topType: null,
      goal: profile?.goal || 'general_fitness',
    };
  }
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const prevWeekStart = startOfWeek(subDays(weekStart, 1), { weekStartsOn: 1 });
  const prevWeekEnd = endOfWeek(subDays(weekStart, 1), { weekStartsOn: 1 });

  const thisWeek = workouts.filter((w) =>
    isWithinInterval(new Date(w.performedAt), { start: weekStart, end: weekEnd }),
  );
  const prevWeek = workouts.filter((w) =>
    isWithinInterval(new Date(w.performedAt), { start: prevWeekStart, end: prevWeekEnd }),
  );

  const typeCounts = workouts.reduce((acc, w) => {
    acc[w.type] = (acc[w.type] || 0) + 1;
    return acc;
  }, {});
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    totalWorkouts: workouts.length,
    weekCount: thisWeek.length,
    prevWeekCount: prevWeek.length,
    weekMinutes: thisWeek.reduce((s, w) => s + (w.durationMinutes || 0), 0),
    weekCalories: thisWeek.reduce((s, w) => s + (w.caloriesBurned || 0), 0),
    streakDays: computeStreak(workouts),
    topType,
    goal: profile?.goal || 'general_fitness',
  };
}

function computeStreak(workouts) {
  if (!workouts.length) return 0;
  const daySet = new Set(
    workouts.map((w) => startOfDay(new Date(w.performedAt)).getTime()),
  );
  let streak = 0;
  let cursor = startOfDay(new Date());
  while (daySet.has(cursor.getTime())) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export function toDailySeries(workouts, days = 14) {
  const map = new Map();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = startOfDay(subDays(new Date(), i));
    map.set(d.getTime(), { date: format(d, 'MMM d'), minutes: 0, calories: 0, workouts: 0 });
  }
  workouts.forEach((w) => {
    const key = startOfDay(new Date(w.performedAt)).getTime();
    if (map.has(key)) {
      const entry = map.get(key);
      map.set(key, {
        ...entry,
        minutes: entry.minutes + (w.durationMinutes || 0),
        calories: entry.calories + (w.caloriesBurned || 0),
        workouts: entry.workouts + 1,
      });
    }
  });
  return Array.from(map.values());
}

export function toTypeBreakdown(workouts) {
  const map = new Map();
  workouts.forEach((w) => {
    map.set(w.type, (map.get(w.type) || 0) + 1);
  });
  return Array.from(map.entries()).map(([type, count]) => ({
    type,
    count,
    label: typeLabel(type),
  }));
}

function typeLabel(type) {
  const labels = {
    strength: 'Strength',
    cardio: 'Cardio',
    hiit: 'HIIT',
    yoga: 'Yoga',
    sport: 'Sport',
    walk: 'Walk/Run',
  };
  return labels[type] || type;
}

export const GOAL_OPTIONS = [
  { id: 'general_fitness', label: 'General fitness' },
  { id: 'weight_loss', label: 'Weight loss' },
  { id: 'muscle_gain', label: 'Build muscle' },
];

export const LEVEL_OPTIONS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

export const EQUIPMENT_OPTIONS = [
  { id: 'bodyweight', label: 'Bodyweight only' },
  { id: 'dumbbells', label: 'Dumbbells + bench' },
  { id: 'full_gym', label: 'Full gym access' },
];
