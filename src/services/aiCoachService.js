// NOTE: VITE_GEMINI_API_KEY is bundled into the client JS by Vite. For a
// production deployment, proxy this call through a serverless function and
// keep the key on the server. At minimum, restrict the key in Google Cloud
// Console to your deployed HTTP referrer (see README section 10).
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export function hasGeminiKey() {
  return Boolean(import.meta.env.VITE_GEMINI_API_KEY);
}

export async function generateWorkoutPlan(profile) {
  if (hasGeminiKey()) {
    try {
      return await generateWithGemini(profile);
    } catch (err) {
      console.warn('Gemini call failed, using local generator:', err?.message);
    }
  }
  return generateLocally(profile);
}

export async function generateInsight(stats) {
  if (!hasGeminiKey()) return localInsight(stats);
  try {
    const prompt = insightPrompt(stats);
    const text = await callGemini(prompt);
    return text.trim();
  } catch {
    return localInsight(stats);
  }
}

async function generateWithGemini(profile) {
  const prompt = planPrompt(profile);
  const text = await callGemini(prompt);
  const parsed = safeParseJson(text);
  if (parsed && Array.isArray(parsed.days)) return { ...parsed, source: 'gemini' };
  return { ...generateLocally(profile), source: 'gemini-fallback' };
}

async function callGemini(prompt) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const json = await res.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function planPrompt(profile) {
  return `You are a certified personal trainer. Build a weekly workout plan as strict JSON with this exact shape:
{
  "summary": "short sentence about focus of the week",
  "days": [
    { "day": "Day 1", "focus": "...", "exercises": [ { "name": "...", "sets": 3, "reps": "8-10", "rest": "60s" } ] }
  ],
  "tips": ["tip 1", "tip 2", "tip 3"]
}
Requirements:
- Goal: ${profile.goal}
- Fitness level: ${profile.fitnessLevel}
- Equipment available: ${profile.equipment}
- Training days per week: ${profile.daysPerWeek || 3}
- Each day should list 4-6 exercises.
- Use bodyweight alternatives if equipment is limited.
Return ONLY the JSON, no markdown, no commentary.`;
}

function insightPrompt(stats) {
  return `You are a friendly fitness coach. In 2 sentences, give an encouraging, actionable insight based on this data:
Workouts this week: ${stats.weekCount}
Workouts last week: ${stats.prevWeekCount}
Total minutes this week: ${stats.weekMinutes}
Most common type: ${stats.topType || 'none yet'}
Goal: ${stats.goal}
Keep it under 280 characters. No emojis.`;
}

function safeParseJson(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return null; }
    }
    return null;
  }
}

function generateLocally(profile) {
  const days = Math.max(2, Math.min(6, Number(profile.daysPerWeek) || 3));
  const tmpl = PLAN_TEMPLATES[profile.goal]?.[profile.fitnessLevel] ||
    PLAN_TEMPLATES.general_fitness.beginner;
  const rotation = tmpl.days;
  const plan = [];
  for (let i = 0; i < days; i += 1) {
    const template = rotation[i % rotation.length];
    plan.push({
      day: `Day ${i + 1}`,
      focus: template.focus,
      exercises: adaptExercises(template.exercises, profile.equipment),
    });
  }
  return {
    summary: tmpl.summary,
    days: plan,
    tips: tmpl.tips,
    source: 'local',
  };
}

function adaptExercises(exercises, equipment) {
  if (equipment === 'bodyweight') {
    return exercises.map((ex) => ({
      ...ex,
      name: ex.bodyweight || ex.name,
    }));
  }
  return exercises.map(({ bodyweight: _bw, ...rest }) => rest);
}

function localInsight({ weekCount, prevWeekCount, weekMinutes, topType, goal }) {
  if (weekCount === 0 && prevWeekCount === 0) {
    return `Every journey starts with a single session. Log your first workout today to start tracking toward your ${goal.replace('_', ' ')} goal.`;
  }
  const delta = weekCount - prevWeekCount;
  if (delta > 0) {
    return `You're up ${delta} workout${delta > 1 ? 's' : ''} from last week — ${weekMinutes} minutes logged. Keep the momentum, especially with ${topType || 'varied training'}.`;
  }
  if (delta < 0) {
    return `You logged ${weekCount} workout${weekCount === 1 ? '' : 's'} this week, down from ${prevWeekCount}. Schedule your next session now to get back on track.`;
  }
  return `Consistency pays off — ${weekCount} workouts and ${weekMinutes} minutes this week. Try progressive overload in your next ${topType || 'session'} to keep growing.`;
}

const PLAN_TEMPLATES = {
  general_fitness: {
    beginner: {
      summary: 'Build a strong base with full-body training and light cardio.',
      tips: [
        'Warm up for 5 minutes before every session.',
        'Focus on form over heavy weight.',
        'Rest 48 hours before training the same muscle group.',
      ],
      days: [
        {
          focus: 'Full-body strength',
          exercises: [
            { name: 'Goblet Squat', bodyweight: 'Bodyweight Squat', sets: 3, reps: '10-12', rest: '60s' },
            { name: 'Dumbbell Bench Press', bodyweight: 'Push-Up', sets: 3, reps: '8-10', rest: '60s' },
            { name: 'Bent-Over Row', bodyweight: 'Inverted Row', sets: 3, reps: '10', rest: '60s' },
            { name: 'Plank', sets: 3, reps: '30s', rest: '45s' },
          ],
        },
        {
          focus: 'Cardio + core',
          exercises: [
            { name: 'Brisk Walk or Jog', sets: 1, reps: '25 min', rest: '-' },
            { name: 'Mountain Climbers', sets: 3, reps: '30s', rest: '30s' },
            { name: 'Dead Bug', sets: 3, reps: '10/side', rest: '30s' },
            { name: 'Glute Bridge', sets: 3, reps: '12', rest: '45s' },
          ],
        },
        {
          focus: 'Lower body + mobility',
          exercises: [
            { name: 'Romanian Deadlift', bodyweight: 'Single-Leg Glute Bridge', sets: 3, reps: '10', rest: '60s' },
            { name: 'Walking Lunge', sets: 3, reps: '10/leg', rest: '60s' },
            { name: 'Calf Raise', sets: 3, reps: '15', rest: '45s' },
            { name: 'Hip Flexor Stretch', sets: 2, reps: '45s/side', rest: '30s' },
          ],
        },
      ],
    },
    intermediate: {
      summary: 'Push volume with upper/lower split and moderate-intensity cardio.',
      tips: [
        'Add one extra rep or 2.5 kg each week.',
        'Keep one session under 60 minutes.',
        'Hydrate — aim for 2 liters on training days.',
      ],
      days: [
        {
          focus: 'Upper body push',
          exercises: [
            { name: 'Barbell Bench Press', bodyweight: 'Decline Push-Up', sets: 4, reps: '6-8', rest: '90s' },
            { name: 'Overhead Press', bodyweight: 'Pike Push-Up', sets: 4, reps: '8', rest: '90s' },
            { name: 'Incline Dumbbell Press', bodyweight: 'Incline Push-Up', sets: 3, reps: '10', rest: '60s' },
            { name: 'Triceps Dip', sets: 3, reps: '10-12', rest: '60s' },
            { name: 'Plank to Push-Up', sets: 3, reps: '30s', rest: '45s' },
          ],
        },
        {
          focus: 'Lower body',
          exercises: [
            { name: 'Back Squat', bodyweight: 'Bulgarian Split Squat', sets: 4, reps: '6-8', rest: '120s' },
            { name: 'Romanian Deadlift', bodyweight: 'Single-Leg RDL', sets: 4, reps: '8', rest: '90s' },
            { name: 'Walking Lunge', sets: 3, reps: '12/leg', rest: '60s' },
            { name: 'Hanging Knee Raise', sets: 3, reps: '12', rest: '60s' },
          ],
        },
        {
          focus: 'Upper body pull + conditioning',
          exercises: [
            { name: 'Pull-Up or Lat Pulldown', bodyweight: 'Inverted Row', sets: 4, reps: '6-8', rest: '90s' },
            { name: 'Barbell Row', bodyweight: 'Superman Hold', sets: 4, reps: '8', rest: '90s' },
            { name: 'Face Pull', bodyweight: 'Band Pull-Apart', sets: 3, reps: '12', rest: '60s' },
            { name: '20-min Zone 2 Cardio', sets: 1, reps: '20 min', rest: '-' },
          ],
        },
      ],
    },
    advanced: {
      summary: 'Periodized push/pull/legs with accessory work and conditioning.',
      tips: [
        'Deload every 4th week.',
        'Log RPE per set to track fatigue.',
        'Sleep 7+ hours for recovery.',
      ],
      days: [
        {
          focus: 'Push (chest/shoulders/triceps)',
          exercises: [
            { name: 'Bench Press', sets: 5, reps: '5', rest: '120s' },
            { name: 'Incline Dumbbell Press', sets: 4, reps: '8', rest: '90s' },
            { name: 'Seated DB Shoulder Press', sets: 4, reps: '8', rest: '90s' },
            { name: 'Cable Fly', sets: 3, reps: '12', rest: '60s' },
            { name: 'Overhead Triceps Extension', sets: 3, reps: '10', rest: '60s' },
          ],
        },
        {
          focus: 'Pull (back/biceps)',
          exercises: [
            { name: 'Weighted Pull-Up', sets: 5, reps: '5', rest: '120s' },
            { name: 'Barbell Row', sets: 4, reps: '6-8', rest: '90s' },
            { name: 'Chest-Supported Row', sets: 3, reps: '10', rest: '60s' },
            { name: 'EZ-Bar Curl', sets: 3, reps: '10', rest: '60s' },
            { name: 'Face Pull', sets: 3, reps: '15', rest: '45s' },
          ],
        },
        {
          focus: 'Legs + core',
          exercises: [
            { name: 'Back Squat', sets: 5, reps: '5', rest: '120s' },
            { name: 'Romanian Deadlift', sets: 4, reps: '6-8', rest: '120s' },
            { name: 'Leg Press', sets: 3, reps: '10', rest: '90s' },
            { name: 'Standing Calf Raise', sets: 4, reps: '12', rest: '60s' },
            { name: 'Weighted Plank', sets: 3, reps: '45s', rest: '60s' },
          ],
        },
      ],
    },
  },
  weight_loss: {
    beginner: {
      summary: 'Burn calories with a mix of circuit training and daily walks.',
      tips: [
        'Aim for 8,000-10,000 steps daily.',
        'Keep circuits to 20-25 minutes — intensity matters more than length.',
        'Track protein: roughly 1.6g per kg of bodyweight.',
      ],
      days: [
        {
          focus: 'Full-body circuit',
          exercises: [
            { name: 'Kettlebell Swing', bodyweight: 'Jumping Jacks', sets: 4, reps: '30s', rest: '30s' },
            { name: 'Goblet Squat', bodyweight: 'Bodyweight Squat', sets: 4, reps: '12', rest: '30s' },
            { name: 'Push-Up', sets: 4, reps: '10', rest: '30s' },
            { name: 'Plank', sets: 3, reps: '30s', rest: '30s' },
          ],
        },
        {
          focus: 'Low-impact cardio',
          exercises: [
            { name: 'Brisk Walk', sets: 1, reps: '30 min', rest: '-' },
            { name: 'Standing Side Leg Raise', sets: 3, reps: '15/side', rest: '30s' },
            { name: 'Glute Bridge', sets: 3, reps: '15', rest: '30s' },
          ],
        },
        {
          focus: 'HIIT intervals',
          exercises: [
            { name: 'High Knees', sets: 6, reps: '20s on / 40s off', rest: '-' },
            { name: 'Burpee (half)', sets: 6, reps: '20s on / 40s off', rest: '-' },
            { name: 'Mountain Climbers', sets: 6, reps: '20s on / 40s off', rest: '-' },
          ],
        },
      ],
    },
    intermediate: {
      summary: 'Strength + conditioning to preserve muscle while burning fat.',
      tips: [
        'Stay in a modest calorie deficit (300-500 kcal/day).',
        'Prioritize compound lifts — they burn more.',
        'Take one full rest day per week.',
      ],
      days: [
        {
          focus: 'Lower body strength',
          exercises: [
            { name: 'Back Squat', bodyweight: 'Jump Squat', sets: 4, reps: '8', rest: '90s' },
            { name: 'Romanian Deadlift', bodyweight: 'Single-Leg RDL', sets: 3, reps: '10', rest: '75s' },
            { name: 'Walking Lunge', sets: 3, reps: '12/leg', rest: '60s' },
            { name: 'Farmer Carry', bodyweight: 'Wall Sit', sets: 3, reps: '40s', rest: '45s' },
          ],
        },
        {
          focus: 'Metabolic conditioning',
          exercises: [
            { name: 'Rowing Machine Intervals', sets: 5, reps: '250m fast / 60s rest', rest: '-' },
            { name: 'Kettlebell Swing', sets: 4, reps: '15', rest: '45s' },
            { name: 'Push-Up to Row', sets: 3, reps: '10/side', rest: '60s' },
          ],
        },
        {
          focus: 'Upper body strength',
          exercises: [
            { name: 'Dumbbell Bench Press', bodyweight: 'Push-Up', sets: 4, reps: '8-10', rest: '75s' },
            { name: 'One-Arm Row', bodyweight: 'Inverted Row', sets: 4, reps: '10', rest: '75s' },
            { name: 'Overhead Press', bodyweight: 'Pike Push-Up', sets: 3, reps: '10', rest: '60s' },
            { name: 'Plank with Shoulder Tap', sets: 3, reps: '20 taps', rest: '45s' },
          ],
        },
      ],
    },
    advanced: {
      summary: 'High-volume training with conditioning finishers.',
      tips: [
        'Track macros — protein high, fats moderate.',
        'Include 2 hard conditioning sessions per week.',
        'Deload every 6 weeks.',
      ],
      days: [
        {
          focus: 'Upper + finisher',
          exercises: [
            { name: 'Bench Press', sets: 5, reps: '5', rest: '120s' },
            { name: 'Weighted Pull-Up', sets: 4, reps: '6', rest: '120s' },
            { name: 'DB Incline Press', sets: 3, reps: '10', rest: '75s' },
            { name: 'Battle Ropes', sets: 5, reps: '30s on / 30s off', rest: '-' },
          ],
        },
        {
          focus: 'Lower + finisher',
          exercises: [
            { name: 'Front Squat', sets: 5, reps: '5', rest: '150s' },
            { name: 'Romanian Deadlift', sets: 4, reps: '8', rest: '120s' },
            { name: 'Walking Lunge (weighted)', sets: 3, reps: '14/leg', rest: '90s' },
            { name: 'Assault Bike Sprints', sets: 8, reps: '20s on / 40s off', rest: '-' },
          ],
        },
        {
          focus: 'Conditioning & core',
          exercises: [
            { name: 'Sled Push', bodyweight: 'Bear Crawl', sets: 6, reps: '20m', rest: '60s' },
            { name: 'Kettlebell Swing', sets: 5, reps: '20', rest: '60s' },
            { name: 'Hanging Leg Raise', sets: 4, reps: '12', rest: '60s' },
            { name: 'Russian Twist (weighted)', sets: 3, reps: '20', rest: '45s' },
          ],
        },
      ],
    },
  },
  muscle_gain: {
    beginner: {
      summary: 'Build muscle with compound lifts and progressive overload.',
      tips: [
        'Eat in a 200-300 kcal daily surplus.',
        'Aim for 1.6-2.0 g protein per kg bodyweight.',
        'Add weight every 1-2 weeks if reps feel easy.',
      ],
      days: [
        {
          focus: 'Full-body A',
          exercises: [
            { name: 'Back Squat', bodyweight: 'Bulgarian Split Squat', sets: 4, reps: '8-10', rest: '90s' },
            { name: 'Dumbbell Bench Press', bodyweight: 'Push-Up', sets: 4, reps: '8-10', rest: '75s' },
            { name: 'Lat Pulldown', bodyweight: 'Inverted Row', sets: 4, reps: '10', rest: '75s' },
            { name: 'DB Lateral Raise', bodyweight: 'Pike Push-Up', sets: 3, reps: '12', rest: '60s' },
          ],
        },
        {
          focus: 'Full-body B',
          exercises: [
            { name: 'Romanian Deadlift', bodyweight: 'Single-Leg RDL', sets: 4, reps: '8', rest: '90s' },
            { name: 'Overhead Press', bodyweight: 'Pike Push-Up', sets: 4, reps: '8', rest: '90s' },
            { name: 'Seated Cable Row', bodyweight: 'Inverted Row', sets: 4, reps: '10', rest: '75s' },
            { name: 'EZ-Bar Curl', bodyweight: 'Chin-Up', sets: 3, reps: '10', rest: '60s' },
          ],
        },
        {
          focus: 'Arms + core',
          exercises: [
            { name: 'DB Curl', bodyweight: 'Chin-Up', sets: 4, reps: '10', rest: '60s' },
            { name: 'Triceps Rope Pushdown', bodyweight: 'Diamond Push-Up', sets: 4, reps: '12', rest: '60s' },
            { name: 'Hanging Knee Raise', sets: 3, reps: '12', rest: '60s' },
            { name: 'Plank', sets: 3, reps: '45s', rest: '45s' },
          ],
        },
      ],
    },
    intermediate: {
      summary: 'Upper/lower split with hypertrophy rep ranges.',
      tips: [
        'Train each muscle group twice a week.',
        'Stay 1-2 reps shy of failure on most sets.',
        'Sleep drives growth — prioritize 7-9 hours.',
      ],
      days: [
        {
          focus: 'Upper A',
          exercises: [
            { name: 'Bench Press', sets: 4, reps: '6-8', rest: '120s' },
            { name: 'Weighted Pull-Up', sets: 4, reps: '6-8', rest: '120s' },
            { name: 'DB Shoulder Press', sets: 3, reps: '10', rest: '75s' },
            { name: 'Cable Row', sets: 3, reps: '10', rest: '75s' },
            { name: 'Triceps Pushdown', sets: 3, reps: '12', rest: '60s' },
          ],
        },
        {
          focus: 'Lower A',
          exercises: [
            { name: 'Back Squat', sets: 4, reps: '6-8', rest: '150s' },
            { name: 'Romanian Deadlift', sets: 4, reps: '8', rest: '120s' },
            { name: 'Leg Press', sets: 3, reps: '10', rest: '90s' },
            { name: 'Standing Calf Raise', sets: 3, reps: '15', rest: '60s' },
          ],
        },
        {
          focus: 'Upper B',
          exercises: [
            { name: 'Overhead Press', sets: 4, reps: '6-8', rest: '120s' },
            { name: 'Barbell Row', sets: 4, reps: '8', rest: '90s' },
            { name: 'Incline DB Press', sets: 3, reps: '10', rest: '75s' },
            { name: 'Face Pull', sets: 3, reps: '15', rest: '60s' },
            { name: 'EZ Curl', sets: 3, reps: '10', rest: '60s' },
          ],
        },
      ],
    },
    advanced: {
      summary: 'Push / Pull / Legs with high weekly volume.',
      tips: [
        'Track volume — aim for 10-20 hard sets per muscle/week.',
        'Rotate exercise variations every 6-8 weeks.',
        'Keep conditioning light to preserve recovery.',
      ],
      days: [
        {
          focus: 'Push',
          exercises: [
            { name: 'Bench Press', sets: 5, reps: '5', rest: '150s' },
            { name: 'Incline DB Press', sets: 4, reps: '8', rest: '90s' },
            { name: 'Seated DB Press', sets: 3, reps: '10', rest: '90s' },
            { name: 'Cable Fly', sets: 3, reps: '12', rest: '60s' },
            { name: 'Skullcrusher', sets: 3, reps: '10', rest: '60s' },
          ],
        },
        {
          focus: 'Pull',
          exercises: [
            { name: 'Deadlift', sets: 4, reps: '5', rest: '180s' },
            { name: 'Weighted Pull-Up', sets: 4, reps: '6-8', rest: '120s' },
            { name: 'Chest-Supported Row', sets: 3, reps: '10', rest: '75s' },
            { name: 'Hammer Curl', sets: 3, reps: '10', rest: '60s' },
            { name: 'Rear Delt Fly', sets: 3, reps: '15', rest: '45s' },
          ],
        },
        {
          focus: 'Legs',
          exercises: [
            { name: 'Back Squat', sets: 5, reps: '5', rest: '180s' },
            { name: 'Romanian Deadlift', sets: 4, reps: '8', rest: '120s' },
            { name: 'Bulgarian Split Squat', sets: 3, reps: '10/leg', rest: '90s' },
            { name: 'Leg Curl', sets: 3, reps: '12', rest: '60s' },
            { name: 'Standing Calf Raise', sets: 4, reps: '15', rest: '45s' },
          ],
        },
      ],
    },
  },
};
