import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getFirebaseConfigError } from '../services/firebase';

export default function ConfigWarning() {
  const { firebaseReady } = useAuth();
  if (firebaseReady) return null;
  const configError = getFirebaseConfigError();

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-auto max-w-5xl mt-4 rounded-r-lg">
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <p className="font-medium">Firebase is not configured.</p>
          <p className="mt-1">
            Copy <code className="bg-yellow-100 px-1 rounded">.env.example</code> to{' '}
            <code className="bg-yellow-100 px-1 rounded">.env.local</code>, fill in your Firebase
            keys, and restart the dev server to enable auth and saved workouts.
          </p>
          {configError && <p className="mt-2 break-words">{configError}</p>}
        </div>
      </div>
    </div>
  );
}
