import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication states
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('owner_token'));
  const [cafeName, setCafeName] = useState<string | null>(() => localStorage.getItem('owner_cafe_name'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Mobile menu state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── LOGIN HANDLER ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLoginError('Please enter both email and password.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      if (!response.ok) {
        let errMessage = 'Invalid email or password.';
        try {
          const body = await response.json();
          if (body?.error) errMessage = body.error;
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      }

      const data = await response.json();
      localStorage.setItem('owner_token', data.token);
      localStorage.setItem('owner_cafe_name', data.cafe.name);
      setToken(data.token);
      setCafeName(data.cafe.name);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ── LOGOUT HANDLER ──
  const handleLogout = () => {
    localStorage.removeItem('owner_token');
    localStorage.removeItem('owner_cafe_name');
    setToken(null);
    setCafeName(null);
    navigate('/owner/orders'); // Reset to root owner route
  };

  // Close sidebar on path change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // If not logged in, render the login card
  if (!token) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <div className="bg-surface rounded-lg shadow-card border border-line p-6 w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-lg font-bold text-ink">Owner Dashboard</h1>
            <p className="text-xs text-muted mt-1">
              Sign in to manage your cafe.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-red-50 text-red-600 border border-red-100 text-xs font-semibold p-3 rounded-lg">
                {loginError}
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
                className="w-full border border-line rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-saffron-500 bg-canvas transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-xs font-bold text-ink">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-saffron-600 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-line rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-saffron-500 bg-canvas transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-saffron-500 hover:bg-saffron-600 active:scale-[0.98] text-white font-bold rounded-lg py-3 shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Sidebar navigation links configuration
  const navItems = [
    { name: 'Active Orders', path: '/owner/orders' },
    { name: 'Menu Manager', path: '/dashboard/menu' },
    { name: 'Category Manager', path: '/dashboard/categories' },
    { name: 'QR Generator', path: '/owner/qr' },
    { name: 'Reports', path: '/dashboard/reports' },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col md:flex-row relative">
      {/* ── MOBILE NAV HEADER ── */}
      <div className="md:hidden bg-surface border-b border-line px-4 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div>
          <span className="font-extrabold text-sm text-ink block leading-none font-serif">{cafeName}</span>
          <span className="text-[9px] font-bold text-saffron-500 tracking-wider uppercase">Owner Panel</span>
        </div>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 hover:bg-canvas rounded-lg text-ink font-bold focus:outline-none text-lg"
          aria-label="Toggle Navigation Menu"
        >
          {isSidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* ── SIDEBAR DRAWER (Responsive) ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-canvas text-ink flex flex-col justify-between p-5 border-r border-line
          transform transition-transform duration-300 ease-in-out md:relative md:transform-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="space-y-6">
          {/* Cafe Header Profile */}
          <div className="hidden md:flex items-center gap-3 border-b border-line pb-4 mb-4">
            <div className="w-9 h-9 rounded-full bg-saffron-500 flex items-center justify-center font-black text-canvas text-base">
              {cafeName?.[0] ?? 'C'}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-ink truncate leading-tight font-serif">{cafeName}</h2>
              <span className="text-[9px] font-bold text-saffron-500 tracking-wider uppercase block">Owner Panel</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left text-xs font-semibold transition-all duration-150
                    ${
                      isActive
                        ? 'bg-saffron-500 text-canvas shadow-md'
                        : 'text-muted hover:bg-saffron-50/50 hover:text-ink'
                    }
                  `}
                >
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout button at bottom */}
        <div className="border-t border-line pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left text-xs font-semibold text-muted hover:text-red-600 hover:bg-red-50 transition-all"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-ink/40 md:hidden"
        />
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
