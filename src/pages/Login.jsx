import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, Mail, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import ConfigWarning from '../components/ConfigWarning';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
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
          <p className="text-ink-500">Welcome back. Let's get moving.</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
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
                autoComplete="current-password"
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
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
          <p className="text-sm text-center text-ink-500">
            New here?{' '}
            <Link to="/signup" className="text-brand-600 font-medium hover:underline">
              Create an account
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
    return 'Email/password sign-in is disabled in Firebase Authentication.';
  if (code.includes('invalid-credential') || code.includes('wrong-password'))
    return 'Invalid email or password.';
  if (code.includes('user-not-found')) return 'No account found with that email.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Try again later.';
  if (code.includes('auth/invalid-api-key')) return 'Your Firebase API key is invalid.';
  if (code.includes('unauthorized-domain'))
    return 'This domain is not authorized in Firebase Authentication.';
  if (code.includes('network-request-failed')) return 'Network error. Check your connection.';
  return `Unable to sign in. ${code || 'Unknown Firebase error.'}`;
}
