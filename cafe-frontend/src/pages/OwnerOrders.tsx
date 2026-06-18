import { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface OrderItem {
  id: number;
  item_name: string;
  item_price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: number;
  cafe_id: number;
  table_number: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  customer_note: string | null;
  created_at: number;
  updated_at: number;
  items: OrderItem[];
}

export function OwnerOrders() {
  // Authentication states
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('owner_token'));
  const [cafeName, setCafeName] = useState<string | null>(() => localStorage.getItem('owner_cafe_name'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Orders states
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // ── 1. OWNER LOGIN HANDLER ──
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

  // ── 2. LOGOUT HANDLER ──
  const handleLogout = () => {
    localStorage.removeItem('owner_token');
    localStorage.removeItem('owner_cafe_name');
    setToken(null);
    setCafeName(null);
    setOrders([]);
  };

  // ── 3. FETCH ORDERS ──
  const fetchOrders = async (showLoading = false) => {
    if (!token) return;
    if (showLoading) setIsLoadingOrders(true);

    try {
      const response = await fetch(`${BASE_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        // Token expired or invalid, force logout
        handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load active orders.');
      }

      const data = await response.json();
      // Status in backend defaults to returning pending, confirmed, preparing orders
      setOrders(data.orders);
      setOrdersError(null);
    } catch (err) {
      console.error(err);
      setOrdersError(err instanceof Error ? err.message : 'Connection error.');
    } finally {
      if (showLoading) setIsLoadingOrders(false);
    }
  };

  // ── 4. MARK ORDER STATUS PATCH ──
  const handleUpdateStatus = async (orderId: number, nextStatus: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status.');
      }

      // Fade out from live kitchen view list by filtering it out
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to change status.');
    }
  };

  // ── 5. LIVE POLLING LOOP (5000ms) ──
  useEffect(() => {
    if (!token) return;

    // Fetch immediately on mount
    fetchOrders(true);

    const intervalId = setInterval(() => {
      fetchOrders(false);
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [token]);

  // Render Login Card if not authenticated
  if (!token) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <div className="bg-surface rounded-2xl shadow-card border border-line p-6 w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-12 h-12 bg-saffron-100 rounded-full flex items-center justify-center mx-auto mb-3 text-saffron-600 text-2xl">
              🔑
            </div>
            <h1 className="text-lg font-bold text-ink">Owner Dashboard</h1>
            <p className="text-xs text-muted mt-1">
              Sign in to access your kitchen queue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-red-50 text-red-600 border border-red-100 text-xs font-semibold p-3 rounded-xl">
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
                className="w-full border border-line rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-saffron-500 bg-canvas transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-ink mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-line rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-saffron-500 bg-canvas transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-saffron-500 hover:bg-saffron-600 active:scale-[0.98] text-white font-bold rounded-xl py-3 shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render Kitchen View Dashboard
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Sticky Dashboard Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-line shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍳</span>
          <div>
            <h1 className="font-extrabold text-base leading-tight text-ink">Kitchen Queue</h1>
            <p className="text-[10px] text-saffron-600 font-bold tracking-wider uppercase">
              {cafeName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchOrders(true)}
            className="p-1.5 hover:bg-line rounded-lg text-xs font-bold text-muted transition-colors flex items-center gap-1"
            title="Refresh list"
          >
            🔄 Sync
          </button>
          <button
            onClick={handleLogout}
            className="bg-line hover:bg-red-50 hover:text-red-600 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-1 p-6">
        {ordersError && (
          <div className="max-w-md mx-auto bg-red-50 text-red-600 border border-red-100 text-xs font-semibold p-3.5 rounded-2xl mb-6 text-center">
            {ordersError}
          </div>
        )}

        {isLoadingOrders && orders.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-surface border border-line rounded-2xl p-4 h-64 space-y-4">
                <div className="flex justify-between">
                  <div className="h-5 bg-line rounded w-1/4" />
                  <div className="h-5 bg-line rounded w-1/3" />
                </div>
                <div className="h-8 bg-line rounded w-full" />
                <div className="space-y-2 pt-2">
                  <div className="h-4 bg-line rounded w-3/4" />
                  <div className="h-4 bg-line rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-muted">
            <div className="text-6xl mb-4">💤</div>
            <h2 className="text-lg font-bold text-ink">No Active Orders</h2>
            <p className="text-sm mt-1 max-w-xs text-muted">
              Any new orders scanned from tables will show up here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              // Convert UNIX timestamp to HH:MM AM/PM
              const orderTime = new Date(order.created_at * 1000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={order.id}
                  className={`bg-surface rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-card hover:shadow-md ${
                    order.status === 'pending'
                      ? 'border-saffron-400 ring-2 ring-saffron-100'
                      : 'border-line'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-line flex justify-between items-center bg-canvas/30 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-ink">
                        Order #{order.id}
                      </span>
                      <span className="bg-saffron-100 text-saffron-800 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                        {order.status}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-muted">
                      🕒 {orderTime}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 space-y-4">
                    {/* Table Number Badge */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted">Table / Origin</span>
                      <span className="text-sm font-black text-ink bg-line/60 px-3 py-1 rounded-xl">
                        {order.table_number.replace(/tbale/i, 'Table')}
                      </span>
                    </div>

                    {/* Special Instructions (Alert Box style if present) */}
                    {order.customer_note && (
                      <div className="bg-saffron-50 border border-saffron-200 rounded-xl p-3">
                        <p className="text-[10px] text-saffron-700 font-bold uppercase tracking-wide">
                          Instructions:
                        </p>
                        <p className="text-xs font-medium text-ink mt-0.5">
                          "{order.customer_note}"
                        </p>
                      </div>
                    )}

                    {/* Order Items List */}
                    <div className="space-y-2.5">
                      <p className="text-[10px] text-muted font-bold tracking-wide uppercase">
                        Items Ordered
                      </p>
                      <ul className="divide-y divide-line/60">
                        {order.items.map((item) => (
                          <li key={item.id} className="py-2 flex justify-between items-center text-xs">
                            <span className="font-semibold text-ink">
                              {item.item_name}
                            </span>
                            <span className="text-xs font-bold text-saffron-600 bg-saffron-50 px-2 py-0.5 rounded-lg border border-saffron-100">
                              qty: {item.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 bg-canvas/20 rounded-b-2xl border-t border-line/60 flex gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className="flex-1 bg-saffron-100 hover:bg-saffron-200 active:scale-[0.98] text-saffron-800 text-xs font-bold py-2.5 rounded-xl transition-all"
                      >
                        Accept & Prepare
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'completed')}
                      className="flex-1 bg-saffron-500 hover:bg-saffron-600 active:scale-[0.98] text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm"
                    >
                      Mark as Completed
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
