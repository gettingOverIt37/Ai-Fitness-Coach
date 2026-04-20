import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { createUserProfile } from '../services/profileService';
import ConfigWarning from '../components/ConfigWarning';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await signup(form.email, form.password, form.name);
      try {
        await createUserProfile(user.uid, { displayName: form.name, email: form.email });
      } catch (profileErr) {
        console.error('Profile bootstrap error:', profileErr.code, profileErr.message, profileErr);
      }
      navigate('/onboarding', { replace: true });
    } catch (err) {
      console.error('Signup error:', err.code, err.message, err);
      setError(mapFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-brand-50 to-ink-100">
      <div className="w-full max-w-md">
        <ConfigWarning />
        <div className="text-center mb-8 mt-4">
          <div className="inline-flex items-center gap-2 mb-2">
            <Dumbbell className="h-8 w-8 text-brand-600" />
            <span className="text-2xl font-bold">AI Fitness Coach</span>
          </div>
          <p className="text-ink-500">Start your personalized fitness journey.</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
              <input
                id="name"
                name="name"
                type="text"
                required
                minLength={2}
                className="input pl-9"
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Doe"
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="input pl-9"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="input pl-9"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
          <p className="text-sm text-center text-ink-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function mapFirebaseError(err) {
  const code = err?.code || '';
  const msg = err?.message || '';
  if (msg.includes('Firebase is not configured'))
    return 'Service unavailable. Please try again later.';
  if (code.includes('operation-not-allowed'))
    return 'Email/password sign-up is disabled in Firebase Authentication.';
  if (code.includes('email-already-in-use')) return 'An account already exists with that email.';
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.';
  if (code.includes('invalid-email')) return 'Please enter a valid email address.';
  if (code.includes('auth/invalid-api-key')) return 'Your Firebase API key is invalid.';
  if (code.includes('permission-denied'))
    return 'Account created, but Firestore permissions are blocking profile setup.';
  if (code.includes('unauthorized-domain'))
    return 'This domain is not authorized in Firebase Authentication.';
  if (code.includes('network-request-failed')) return 'Network error. Check your connection.';
  return `Unable to create account. ${code || 'Unknown Firebase error.'}`;
}
