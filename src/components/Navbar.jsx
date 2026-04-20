import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Dumbbell, LayoutDashboard, ListChecks, Sparkles, BarChart3, User as UserIcon, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/workouts', label: 'Workouts', icon: ListChecks },
  { to: '/coach', label: 'AI Coach', icon: Sparkles },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const userLabel = profile.displayName || user?.displayName || user?.email;

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // even if logout fails we still want to drop the user to login
    }
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-white border-b border-ink-300/60 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <Dumbbell className="h-6 w-6 text-brand-600" />
          <span>AI Fitness Coach</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-100'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <span className="text-sm text-ink-500 truncate max-w-[140px]">
            {userLabel}
          </span>
          <button onClick={handleLogout} className="btn-secondary" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <button
          className="md:hidden p-2 rounded-lg hover:bg-ink-100"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileOpen && (
        <nav className="md:hidden border-t border-ink-300/60 bg-white px-4 py-2 space-y-1">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-100'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
          <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </nav>
      )}
    </header>
  );
}
