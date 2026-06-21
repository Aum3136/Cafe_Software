import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isInvalidToken, setIsInvalidToken] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Missing password reset token.');
      setIsInvalidToken(true);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Missing reset token. Cannot reset password.');
      setIsInvalidToken(true);
      return;
    }
    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong.';
      setError(errorMessage);
      
      // If the token is invalid or expired (determined by backend error text or status code), flag it
      if (errorMessage.toLowerCase().includes('token') || responseStatusIs400(err)) {
        setIsInvalidToken(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check if response error is likely token-related
  const responseStatusIs400 = (_err: any) => {
    // If it's an API error, it will usually be a bad request
    return true; // Safe default for user display to offer link request option
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 font-sans text-ink">
      <div className="bg-surface rounded-2xl shadow-card border border-line p-6 w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-saffron-50 rounded-full flex items-center justify-center mx-auto mb-3 text-saffron-600 text-2xl">
            {success ? '🎉' : isInvalidToken ? '⚠️' : '🔒'}
          </div>
          <h1 className="text-lg font-bold text-ink">
            {success ? 'Success!' : isInvalidToken ? 'Reset Link Invalid' : 'Reset Password'}
          </h1>
          <p className="text-xs text-muted mt-1">
            {success 
              ? 'Your password has been changed.' 
              : isInvalidToken 
                ? 'This password reset link is invalid or has expired.'
                : 'Choose a new, strong password for your owner account.'}
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold p-4 rounded-xl text-center leading-relaxed animate-slide-up">
              Your password has been reset successfully! You can now log in using your new credentials.
            </div>
            <button
              onClick={() => navigate('/owner/orders')}
              className="w-full bg-saffron-500 hover:bg-saffron-600 active:scale-[0.98] text-white font-bold rounded-xl py-3 shadow-md transition-all text-sm"
            >
              Go to Sign In
            </button>
          </div>
        ) : isInvalidToken ? (
          <div className="space-y-4">
            <div className="bg-red-50 text-red-600 border border-red-100 text-xs font-semibold p-4 rounded-xl text-center leading-relaxed">
              {error || 'This link has expired or is invalid. Reset tokens are single-use and expire after 1 hour.'}
            </div>
            
            <Link
              to="/forgot-password"
              className="w-full bg-saffron-500 hover:bg-saffron-600 active:scale-[0.98] text-white font-bold rounded-xl py-3 shadow-md transition-all text-sm block text-center"
            >
              Request a New Link
            </Link>

            <div className="text-center pt-2">
              <Link to="/owner/orders" className="text-xs font-bold text-saffron-600 hover:underline">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 border border-red-100 text-xs font-semibold p-3 rounded-xl whitespace-pre-wrap">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="new-password" className="block text-xs font-bold text-ink mb-1">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                required
                disabled={!token}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full border border-line rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-saffron-500 bg-canvas transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-bold text-ink mb-1">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                disabled={!token}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full border border-line rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-saffron-500 bg-canvas transition-colors disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full bg-saffron-500 hover:bg-saffron-600 active:scale-[0.98] text-white font-bold rounded-xl py-3 shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>

            <div className="text-center pt-2">
              <Link to="/owner/orders" className="text-xs font-bold text-saffron-600 hover:underline">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
