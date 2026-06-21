import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        // If it's a rate limit error (429) or other validation error, parse it
        try {
          const body = await response.json();
          if (body?.error) {
            setError(body.error);
            setIsLoading(false);
            return;
          }
        } catch {
          // ignore parsing error, proceed to show success for standard security fallback
        }
      }

      // Show success regardless of outcome (unless rate limit or bad validation was caught above)
      setSubmitted(true);
    } catch (err) {
      setError('Failed to connect to the server. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 font-sans text-ink">
      <div className="bg-surface rounded-2xl shadow-card border border-line p-6 w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-saffron-50 rounded-full flex items-center justify-center mx-auto mb-3 text-saffron-600 text-2xl">
            📧
          </div>
          <h1 className="text-lg font-bold text-ink">Forgot Password?</h1>
          <p className="text-xs text-muted mt-1">
            No worries! Enter your owner email and we'll send you a password reset link.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="bg-saffron-50 text-saffron-600 border border-saffron-100 text-xs font-semibold p-4 rounded-xl text-center leading-relaxed">
              If an account is associated with <strong className="break-all">{email}</strong>, you will receive an email shortly with instructions to reset your password.
            </div>
            <div className="text-center pt-2">
              <Link to="/owner/orders" className="text-xs font-bold text-saffron-600 hover:underline">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 border border-red-100 text-xs font-semibold p-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-ink mb-1">
                Owner Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rahul@chaicorner.in"
                className="w-full border border-line rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-saffron-500 bg-canvas transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-saffron-500 hover:bg-saffron-600 active:scale-[0.98] text-white font-bold rounded-xl py-3 shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </button>

            <div className="text-center pt-2">
              <Link to="/owner/orders" className="text-xs font-bold text-saffron-600 hover:underline">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
