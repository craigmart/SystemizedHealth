import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { supabase, supabaseConfigError } from './supabase';
import AuthScreen from './AuthScreen';

function readAuthCallback() {
  if (typeof window === 'undefined') return { recovery: false, error: '' };
  const hash = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
  const search = new URLSearchParams(window.location.search || '');
  const type = hash.get('type') || search.get('type') || '';
  const rawError = hash.get('error_description') || search.get('error_description') || '';
  return {
    recovery: type === 'recovery',
    error: rawError.replace(/\+/g, ' '),
  };
}

// Read this while the module loads. supabase-js clears the recovery hash only
// after a network round trip, so the flag is still here on first paint.
const initialCallback = readAuthCallback();

function ConfigError({ message }) {
  return (
    <div className="auth-shell">
      <div className="card auth-card" style={{ borderColor: 'var(--danger-color)' }}>
        <h2 style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={24} /> Configuration error
        </h2>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default function AuthGate({ children }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const [recovery, setRecovery] = useState(initialCallback.recovery);

  useEffect(() => {
    if (!supabase) return undefined;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_OUT') setRecovery(false);
      setSession(nextSession);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (supabaseConfigError || !supabase) {
    return (
      <ConfigError
        message={supabaseConfigError || 'The Supabase environment variables are missing.'}
      />
    );
  }

  if (!ready) {
    return (
      <div className="auth-shell">
        <p>Checking sign-in…</p>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen initialError={initialCallback.error} />;
  }

  if (recovery) {
    return <AuthScreen mode="recovery" onRecoveryDone={() => setRecovery(false)} />;
  }

  return children;
}
