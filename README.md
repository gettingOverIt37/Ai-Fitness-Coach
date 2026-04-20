# AI Fitness Coach

A production-level React web app that gives users a **personalized weekly
workout plan**, lets them log sessions, and shows their progress in real time.
Built as an end-term project for *Building Web Applications with React*.

---

## 1. Problem statement

Most generic fitness trackers just count steps or calories. They do not help
you decide **what to actually train today**. Beginners get overwhelmed,
intermediate lifters plateau, and motivation disappears without visible
progress.

**Who is the user?** Busy students and working professionals who want to get
fit but do not want to pay for a personal trainer or build their own program
from scratch.

**What does the app solve?**

1. Gives each user a **weekly workout plan** tuned to their goal
   (weight loss / muscle gain / general fitness), fitness level, available
   equipment, and days per week.
2. Lets them **log workouts** in seconds — type, sets, reps, duration,
   calories, and notes.
3. Shows **visual progress** — streaks, weekly minutes, calories burned, and
   workout-type mix — so momentum is obvious.
4. Generates a **short AI insight** on the dashboard so users know what to
   improve next.

**Why it matters:** reliable, personalized programming is the main reason
people stop or keep training. A self-coached loop (plan → log → see progress →
new plan) has been shown to improve adherence more than any single feature.

---

## 2. Features

| Area                | What's included                                                                 |
| ------------------- | ------------------------------------------------------------------------------- |
| Authentication      | Email/password signup and login (Firebase Auth)                                 |
| Protected routes    | All app pages behind auth — unauthenticated users sent to landing/login         |
| User onboarding     | First-time flow captures goal, level, equipment, days/week                      |
| AI Coach            | Personalized weekly plan — Gemini API when configured, local generator fallback |
| AI insight          | Dashboard shows an adaptive coaching tip based on recent activity               |
| Workout CRUD        | Create, read, update, delete workouts; filter by type; search by name/notes    |
| Progress charts     | Area, bar, and pie charts built with Recharts and `useMemo` for performance    |
| Profile editing     | Update goal, level, equipment, weight/height/age — feeds the AI plan            |
| Responsive UI       | Tailwind CSS, mobile-first, accessible labels and contrast                      |

### Three core features (per the rubric)

1. **AI-generated weekly workout plan** (see `src/pages/Coach.jsx` +
   `src/services/aiCoachService.js`)
2. **Workout logging with full CRUD** (see `src/pages/Workouts.jsx` +
   `src/services/workoutService.js`)
3. **Progress dashboard with charts and streak tracking** (see
   `src/pages/Progress.jsx` + `src/utils/stats.js`)

---

## 3. Tech stack

- **React 19** (functional components + hooks)
- **Vite** — fast dev server and build
- **React Router v7** — client-side routing with a protected route pattern
- **Context API** — global auth state (`AuthContext`) and user profile
  (`ProfileContext`)
- **Firebase** — Auth + Firestore (per-user documents)
- **Google Gemini API** (optional) — live AI plan generation
- **Recharts** — data visualization
- **Tailwind CSS** — design system and responsive styling
- **lucide-react** — icons
- **date-fns** — date math for streak and weekly windows

### Required React concepts (rubric checklist)

| Concept                  | Where to find it                                                   |
| ------------------------ | ------------------------------------------------------------------ |
| Functional components    | Every file in `src/components`, `src/pages`                        |
| Props & composition      | `WorkoutForm`, `Spinner`, `ProtectedRoute`, `AppLayout`            |
| `useState`               | All form pages (`Login`, `Signup`, `Workouts`, `Profile`, etc.)    |
| `useEffect`              | `AuthContext`, `ProfileContext`, `Dashboard` (AI insight)          |
| Conditional rendering    | `Dashboard`, `Coach`, `Workouts` empty states                      |
| Lists & keys             | `Workouts`, `Coach` (day cards), `Progress` pie chart              |
| Lifting state up         | `Workouts` page manages list; `WorkoutForm` is controlled child    |
| Controlled components    | All forms (`Login`, `Signup`, `WorkoutForm`, `Profile`)            |
| React Router             | `src/App.jsx` — nested routes + `ProtectedRoute`                   |
| Context API              | `src/context/AuthContext.jsx`, `src/context/ProfileContext.jsx`    |
| `useMemo`                | `Dashboard`, `Progress`, `Workouts` (filtered list)                |
| `useCallback`            | `Workouts` (handlers), `useWorkouts` hook                          |
| `useRef`                 | `Workouts` (search input focus)                                    |
| Lazy loading + Suspense  | `src/App.jsx` (`React.lazy` for every page)                        |
| Custom hooks             | `useAuth`, `useProfile`, `useWorkouts`                             |

---

## 4. Project structure

```
src/
├── components/         # Reusable UI (Navbar, Spinner, ProtectedRoute, WorkoutForm, ...)
├── context/            # AuthContext, ProfileContext (Context API)
├── hooks/              # useAuth, useProfile, useWorkouts (custom hooks)
├── pages/              # Landing, Login, Signup, Onboarding, Dashboard, Workouts, Coach, Progress, Profile
├── services/           # firebase, workoutService, profileService, aiCoachService
├── utils/              # stats (charts + summaries)
├── App.jsx             # Router + providers + lazy routes
├── main.jsx            # Entry
└── index.css           # Tailwind directives + design tokens
```

---

## 5. Setup instructions

### Prerequisites

- Node.js 18+ and npm
- A Firebase project (free tier works) — see step 2 below

### 1. Install

```bash
cd ai-fitness-coach
npm install
```

### 2. Create a Firebase project

1. Go to <https://console.firebase.google.com> → **Add project**.
2. Inside the project, open **Build → Authentication** and enable the
   **Email/Password** sign-in provider.
3. Open **Build → Firestore Database** and create a database in
   **production mode** (any region).
4. Open **Project settings → General**, scroll to **Your apps**, click the
   web icon `</>` and register a new web app. Copy the `firebaseConfig`
   values.

### 3. (Optional) Firestore security rules

For production, paste this into the Firestore **Rules** tab so users can only
read and write their own data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /workouts/{docId} {
      allow read, update, delete: if request.auth != null
        && resource.data.uid == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.uid == request.auth.uid;
    }
  }
}
```

### 4. Add environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values from step 2. If you want live AI
plans instead of the built-in fallback, also add a free Gemini key from
<https://aistudio.google.com/apikey>.

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GEMINI_API_KEY=    # optional
```

### 5. Run it

```bash
npm run dev       # dev server on http://localhost:5173
npm run build     # production build in /dist
npm run preview   # preview the production build
npm run lint      # eslint
```

---

## 6. Deployment

This is a static Vite build. It works on **Vercel** or **Netlify** out of the
box:

1. Push the repo to GitHub.
2. Import the repo into Vercel/Netlify.
3. Add the same `VITE_*` environment variables in the hosting dashboard.
4. Set the framework preset to **Vite** — build command `npm run build`,
   output directory `dist`.

---

## 7. How the AI Coach works

`src/services/aiCoachService.js` exposes two functions:

- `generateWorkoutPlan(profile)` — if a `VITE_GEMINI_API_KEY` is present, it
  calls the Gemini API with a strict JSON-only prompt. If that fails, or no
  key is set, it falls back to a local rule-based generator with templates
  for every `goal × level` combination. Each plan is adapted to the user's
  equipment (e.g. substituting push-ups when only bodyweight is available).
- `generateInsight(stats)` — builds a short motivational coaching line based
  on weekly trend, top workout type, and goal. Also falls back to a local
  rule-based version when offline.

This keeps the demo reliable during judging **even without an internet
connection**, while still showcasing a real AI integration when keys are
configured.

---

## 8. Scripts

| Command           | What it does                           |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Start the dev server with HMR          |
| `npm run build`   | Production build into `dist/`          |
| `npm run preview` | Preview the production build locally   |
| `npm run lint`    | Run eslint against the whole project   |

---

## 10. Security note on the Gemini API key

Vite bundles any variable that starts with `VITE_` into the client JavaScript,
so `VITE_GEMINI_API_KEY` ships to the browser. This is fine for the offline
rule-based generator (it is not used) but if you want live AI plans in a
deployed build, restrict the key so it can only be used from your own domain.

**Google Cloud Console → APIs & Services → Credentials → your Gemini key →
Application restrictions → HTTP referrers** and add your deployed domain
(for example `https://ai-fitness-coach.vercel.app/*`). For a production-grade
setup, move the call to a server function (Firebase Cloud Functions, Vercel
Edge Function, etc.) so the key never leaves the server.

## 11. License

This project is built for an academic end-term submission. No license applied.
