import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ConfigWarning from './ConfigWarning';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <ConfigWarning />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-ink-500 py-6">
        Built with React + Firebase · AI Fitness Coach
      </footer>
    </div>
  );
}
