import { Link, Navigate } from 'react-router-dom';
import { Dumbbell, Sparkles, BarChart3, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Landing() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-ink-100">
      <header className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Dumbbell className="h-6 w-6 text-brand-600" />
          AI Fitness Coach
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn-secondary">Sign in</Link>
          <Link to="/signup" className="btn-primary">Get started</Link>
        </div>
      </header>
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-ink-900 leading-tight">
          A fitness coach that actually <span className="text-brand-600">learns you</span>.
        </h1>
        <p className="mt-5 text-lg text-ink-700 max-w-2xl mx-auto">
          Get a weekly workout plan tailored to your goal, level, and equipment.
          Log sessions in seconds. Watch the charts move.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/signup" className="btn-primary px-6 py-3 text-base">Create free account</Link>
          <Link to="/login" className="btn-secondary px-6 py-3 text-base">I already have one</Link>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Feature icon={Sparkles} title="AI-generated plans" body="Personalized weekly plans based on your goal, equipment, and fitness level." />
        <Feature icon={BarChart3} title="Visual progress" body="Charts for minutes trained, calories burned, and workout type mix." />
        <Feature icon={ShieldCheck} title="Secure by default" body="Firebase authentication and private per-user data storage." />
      </section>
    </div>
  );
}

function Feature({ icon: Icon, title, body }) {
  return (
    <div className="card">
      <Icon className="h-7 w-7 text-brand-600 mb-3" />
      <h3 className="font-semibold text-ink-900 mb-1">{title}</h3>
      <p className="text-sm text-ink-700">{body}</p>
    </div>
  );
}
