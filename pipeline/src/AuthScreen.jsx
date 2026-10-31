import { useState } from 'react';
import { supabase } from './supabase';

export default function AuthScreen({ mode = 'sign-in', initialError = '', onRecoveryDone }) {
  const [view, setView] = useState(mode === 'recovery' ? 'recovery' : 'sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchView = (next) => {
    setView(next);
    setError('');
    setNotice('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (signInError) setError(signInError.message);
  };

  const handleForgot = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    setSubmitting(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setNotice('If an account exists for that address, a reset link is on the way.');
  };

  const handleRecovery = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (password !== confirmPassword) {
      setError('Those passwords do not match.');
      return;
    }
    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    if (onRecoveryDone) onRecoveryDone();
  };

  const handleSignOut = async () => {
    setSubmitting(true);
    await supabase.auth.signOut();
    setSubmitting(false);
  };

  let title = 'Sign in';
  let intro = 'Sign in to open the pipeline. This site has no public sign-up.';
  if (view === 'forgot') {
    title = 'Reset password';
    intro = 'Enter the account email. The reset link returns to this site.';
  } else if (view === 'recovery') {
    title = 'Choose a new password';
    intro = 'Set a new password to open the pipeline.';
  }

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <h1>{title}</h1>
        <p>{intro}</p>

        {view === 'sign-in' && (
          <form className="auth-form" onSubmit={handleSignIn}>
            <label className="auth-field">
              <span className="form-label">Email</span>
              <input
                className="form-input"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="auth-field">
              <span className="form-label">Password</span>
              <input
                className="form-input"
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
            <button className="auth-switch" type="button" onClick={() => switchView('forgot')}>
              Forgot password?
            </button>
          </form>
        )}

        {view === 'forgot' && (
          <form className="auth-form" onSubmit={handleForgot}>
            <label className="auth-field">
              <span className="form-label">Email</span>
              <input
                className="form-input"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            {notice && <p className="auth-notice" role="status">{notice}</p>}
            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
            <button className="auth-switch" type="button" onClick={() => switchView('sign-in')}>
              Back to sign in
            </button>
          </form>
        )}

        {view === 'recovery' && (
          <form className="auth-form" onSubmit={handleRecovery}>
            <label className="auth-field">
              <span className="form-label">New password</span>
              <input
                className="form-input"
                type="password"
                name="new-password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <label className="auth-field">
              <span className="form-label">Confirm password</span>
              <input
                className="form-input"
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Update password'}
            </button>
            <button className="auth-switch" type="button" onClick={handleSignOut} disabled={submitting}>
              Sign out
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
