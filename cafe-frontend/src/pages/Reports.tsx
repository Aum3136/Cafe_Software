import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, ShoppingBag, IndianRupee, Clock, Trophy, Minus, BarChart2, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchAnalytics, type AnalyticsData, type AnalyticsRange } from '../api/analytics';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function fmtRupee(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function fmtHour(h: number) {
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

const STATUS_COLORS: Record<string, string> = {
  pending:   '#F59E0B',
  confirmed: '#3B82F6',
  preparing: '#8B5CF6',
  ready:     '#10B981',
  completed: '#22C55E',
  cancelled: '#EF4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready:     'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// KPI Card
interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}
function KpiCard({ icon, label, value, sub, accent = '#F59E0B' }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-line/30 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-ghost uppercase tracking-widest">{label}</span>
        <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
          <span style={{ color: accent }}>{icon}</span>
        </span>
      </div>
      <p className="text-2xl font-black text-ink leading-none">{value}</p>
      {sub && <p className="text-[11px] text-muted font-medium">{sub}</p>}
    </div>
  );
}

// Inline SVG Bar Chart for Revenue by Day
interface BarChartProps {
  data: { day: string; revenue: number; orders: number }[];
}
function RevenueBarChart({ data }: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!data.length) {
    return (
      <div className="h-40 flex items-center justify-center text-muted text-xs">
        No data for this period
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const chartH = 120;
  const barW = Math.max(8, Math.min(32, Math.floor(560 / data.length) - 4));
  const gap = Math.max(2, barW * 0.25);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${data.length * (barW + gap)} ${chartH + 32}`}
        className="w-full min-w-[320px]"
        style={{ height: chartH + 40 }}
      >
        {data.map((d, i) => {
          const barH = Math.max(4, (d.revenue / maxRevenue) * chartH);
          const x = i * (barW + gap);
          const y = chartH - barH;
          const isHov = hovered === i;
          const labelDate = d.day.slice(5); // MM-DD

          return (
            <g key={d.day}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Bar */}
              <rect
                x={x} y={y} width={barW} height={barH}
                rx={barW * 0.25}
                fill={isHov ? '#F59E0B' : '#FCD34D'}
                style={{ transition: 'fill 0.15s' }}
              />
              {/* Hover tooltip */}
              {isHov && (
                <g>
                  <rect
                    x={Math.max(0, x - 20)} y={Math.max(0, y - 38)}
                    width={barW + 42} height={34}
                    rx={6} fill="#1C1715" opacity={0.92}
                  />
                  <text
                    x={x + barW / 2 + 1} y={Math.max(14, y - 22)}
                    textAnchor="middle" fill="white"
                    fontSize={9} fontWeight="700"
                  >
                    {fmtRupee(d.revenue)}
                  </text>
                  <text
                    x={x + barW / 2 + 1} y={Math.max(24, y - 10)}
                    textAnchor="middle" fill="#FCD34D"
                    fontSize={8} fontWeight="600"
                  >
                    {d.orders} order{d.orders !== 1 ? 's' : ''}
                  </text>
                </g>
              )}
              {/* X-axis label */}
              {data.length <= 14 && (
                <text
                  x={x + barW / 2} y={chartH + 14}
                  textAnchor="middle" fill="#9CA3AF"
                  fontSize={7.5} fontWeight="600"
                >
                  {labelDate}
                </text>
              )}
            </g>
          );
        })}
        {/* Baseline */}
        <line x1={0} y1={chartH} x2={data.length * (barW + gap)} y2={chartH}
          stroke="#E5E7EB" strokeWidth={1} />
      </svg>
    </div>
  );
}

// CSS Conic-Gradient Donut for Order Status
interface DonutProps {
  data: { status: string; count: number }[];
}
function StatusDonut({ data }: DonutProps) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return (
    <div className="h-40 flex items-center justify-center text-muted text-xs">No orders yet</div>
  );

  let cumulativePct = 0;
  const segments = data.map(d => {
    const pct = (d.count / total) * 100;
    const start = cumulativePct;
    cumulativePct += pct;
    return { ...d, pct, start };
  });

  const gradient = segments
    .map(s => `${STATUS_COLORS[s.status] ?? '#9CA3AF'} ${s.start.toFixed(1)}% ${(s.start + s.pct).toFixed(1)}%`)
    .join(', ');

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div
        className="w-32 h-32 rounded-full flex-shrink-0 relative"
        style={{
          background: `conic-gradient(${gradient})`,
          boxShadow: '0 0 0 8px #fff inset',
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-ink">{fmt(total)}</span>
          <span className="text-[9px] text-ghost font-bold uppercase tracking-wider">Total</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {segments.map(s => (
          <div key={s.status} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: STATUS_COLORS[s.status] ?? '#9CA3AF' }} />
            <span className="text-xs text-ink font-semibold">{STATUS_LABELS[s.status] ?? s.status}</span>
            <span className="text-xs text-ghost ml-auto pl-4">{s.count}</span>
            <span className="text-[10px] text-muted w-8 text-right">{s.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Peak Hours Heatmap Row
interface PeakHoursProps {
  data: { hour: number; orders: number }[];
}
function PeakHoursBar({ data }: PeakHoursProps) {
  const hourMap: Record<number, number> = {};
  data.forEach(d => { hourMap[d.hour] = d.orders; });
  const maxOrders = Math.max(...data.map(d => d.orders), 1);

  const keyHours = [0, 6, 8, 10, 12, 14, 16, 18, 20, 22];

  return (
    <div className="grid grid-cols-12 gap-1">
      {Array.from({ length: 24 }, (_, h) => {
        const count = hourMap[h] ?? 0;
        const intensity = count / maxOrders;
        return (
          <div key={h} className="flex flex-col items-center gap-1 group relative">
            <div
              className="w-full rounded-md transition-all duration-150"
              style={{
                height: 28,
                background: count === 0
                  ? '#F3F4F6'
                  : `rgba(245, 158, 11, ${0.15 + intensity * 0.85})`,
              }}
            />
            {keyHours.includes(h) && (
              <span className="text-[8px] text-ghost font-medium">{fmtHour(h)}</span>
            )}
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-ink text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {fmtHour(h)}: {count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Items table (best / least)
interface ItemTableProps {
  items: { item_id: number; item_name: string; total_qty: number; total_revenue: number }[];
  maxQty: number;
  accentColor: string;
  emptyMsg: string;
}
function ItemTable({ items, maxQty, accentColor, emptyMsg }: ItemTableProps) {
  if (!items.length) {
    return <p className="text-xs text-muted py-4 text-center">{emptyMsg}</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const barPct = maxQty > 0 ? (item.total_qty / maxQty) * 100 : 0;
        return (
          <div key={item.item_id} className="flex items-center gap-3">
            <span className="text-[10px] font-black text-ghost w-4 flex-shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs font-bold text-ink truncate">{item.item_name}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-bold text-muted">{fmt(item.total_qty)} sold</span>
                  <span className="text-[10px] font-black text-saffron-600">{fmtRupee(item.total_revenue)}</span>
                </div>
              </div>
              <div className="h-1.5 bg-line/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barPct}%`, background: accentColor }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN REPORTS PAGE
// ─────────────────────────────────────────────────────────────────────────────

const RANGE_OPTIONS: { label: string; value: AnalyticsRange }[] = [
  { label: 'Today',   value: 'today' },
  { label: '7 Days',  value: '7d'    },
  { label: '30 Days', value: '30d'   },
  { label: 'All Time',value: 'all'   },
];

export function Reports() {
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('owner_token') ?? '';

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchAnalytics(range, token);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [range, token]);

  useEffect(() => { load(); }, [load]);

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-line rounded-lg" />
          <div className="h-8 w-56 bg-line rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(n => <div key={n} className="h-28 bg-line rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-56 bg-line rounded-2xl" />
          <div className="h-56 bg-line rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 bg-line rounded-2xl" />
          <div className="h-72 bg-line rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="text-red-400" size={36} />
          <h2 className="font-bold text-ink">Failed to load analytics</h2>
          <p className="text-xs text-muted max-w-xs">{error}</p>
          <button
            onClick={load}
            className="mt-2 px-5 py-2 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, revenueByDay, bestSellers, leastOrdered, categoryRevenue, statusBreakdown, peakHours, recentOrders } = data;

  const maxBestQty   = bestSellers[0]?.total_qty ?? 1;
  const maxLeastQty  = Math.max(...leastOrdered.map(i => i.total_qty), 1);
  const maxCatRev    = categoryRevenue[0]?.total_revenue ?? 1;
  const completionRate = summary.total_orders > 0
    ? ((summary.completed_orders / summary.total_orders) * 100).toFixed(0)
    : '0';

  return (
    <div className="p-4 lg:p-6 space-y-6 min-h-screen bg-canvas">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-ink font-serif flex items-center gap-2">
            <BarChart2 size={20} className="text-saffron-500" />
            Reports &amp; Analytics
          </h1>
          <p className="text-xs text-muted mt-0.5">Real-time insights into your cafe's performance</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Range Filter Tabs */}
          <div className="flex bg-white border border-line/40 rounded-xl p-1 gap-0.5 shadow-sm">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                  range === opt.value
                    ? 'bg-saffron-500 text-white shadow-sm'
                    : 'text-muted hover:text-ink hover:bg-line/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Refresh */}
          <button
            onClick={load}
            className="w-9 h-9 flex items-center justify-center bg-white border border-line/40 rounded-xl hover:bg-line/10 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={14} className="text-muted" />
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard
          icon={<IndianRupee size={16} />}
          label="Total Revenue"
          value={fmtRupee(summary.total_revenue)}
          sub={`₹${fmt(summary.revenue_today)} today`}
          accent="#F59E0B"
        />
        <KpiCard
          icon={<ShoppingBag size={16} />}
          label="Total Orders"
          value={fmt(summary.total_orders)}
          sub={`${summary.orders_today} today`}
          accent="#3B82F6"
        />
        <KpiCard
          icon={<TrendingUp size={16} />}
          label="Avg Order Value"
          value={fmtRupee(summary.avg_order_value)}
          sub={`${completionRate}% completion rate`}
          accent="#10B981"
        />
        <KpiCard
          icon={<Clock size={16} />}
          label="Completed"
          value={fmt(summary.completed_orders)}
          sub={`${fmt(summary.cancelled_orders)} cancelled`}
          accent="#8B5CF6"
        />
      </div>

      {/* ── REVENUE CHART + STATUS DONUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-line/30 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-ink">Revenue Trend</h2>
              <p className="text-[10px] text-muted">Day-by-day breakdown</p>
            </div>
            <span className="text-xs font-black text-saffron-600">{fmtRupee(summary.total_revenue)}</span>
          </div>
          <RevenueBarChart data={revenueByDay} />
        </div>

        {/* Order Status Donut */}
        <div className="bg-white rounded-2xl border border-line/30 p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-black text-ink">Order Status</h2>
            <p className="text-[10px] text-muted">All orders in this period</p>
          </div>
          <StatusDonut data={statusBreakdown} />
        </div>
      </div>

      {/* ── BEST SELLERS + LEAST ORDERED ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Best Sellers */}
        <div className="bg-white rounded-2xl border border-line/30 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-amber-500" />
            <div>
              <h2 className="text-sm font-black text-ink">Best Sellers</h2>
              <p className="text-[10px] text-muted">Top 10 items by quantity sold</p>
            </div>
          </div>
          <ItemTable
            items={bestSellers}
            maxQty={maxBestQty}
            accentColor="#F59E0B"
            emptyMsg="No orders placed yet in this period."
          />
        </div>

        {/* Least Ordered */}
        <div className="bg-white rounded-2xl border border-line/30 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Minus size={16} className="text-rose-400" />
            <div>
              <h2 className="text-sm font-black text-ink">Least Ordered</h2>
              <p className="text-[10px] text-muted">Items needing attention</p>
            </div>
          </div>
          <ItemTable
            items={leastOrdered}
            maxQty={maxLeastQty}
            accentColor="#FCA5A5"
            emptyMsg="No orders placed yet in this period."
          />
        </div>
      </div>

      {/* ── CATEGORY BREAKDOWN + PEAK HOURS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Revenue */}
        <div className="bg-white rounded-2xl border border-line/30 p-5 shadow-sm">
          <h2 className="text-sm font-black text-ink mb-1">Category Performance</h2>
          <p className="text-[10px] text-muted mb-4">Revenue by menu section</p>
          {categoryRevenue.length === 0 ? (
            <p className="text-xs text-muted py-4 text-center">No data yet</p>
          ) : (
            <div className="space-y-3">
              {categoryRevenue.map(cat => {
                const barPct = maxCatRev > 0 ? (cat.total_revenue / maxCatRev) * 100 : 0;
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-ink">{cat.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted">{fmt(cat.total_qty)} items</span>
                        <span className="text-xs font-black text-saffron-600">{fmtRupee(cat.total_revenue)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-line/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${barPct}%`, background: 'linear-gradient(90deg, #F59E0B, #FBBF24)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Peak Hours Heatmap */}
        <div className="bg-white rounded-2xl border border-line/30 p-5 shadow-sm">
          <h2 className="text-sm font-black text-ink mb-1">Peak Hours</h2>
          <p className="text-[10px] text-muted mb-4">Order volume by hour of day (deeper = busier)</p>
          <PeakHoursBar data={peakHours} />
        </div>
      </div>

      {/* ── RECENT ORDERS FEED ── */}
      <div className="bg-white rounded-2xl border border-line/30 p-5 shadow-sm">
        <h2 className="text-sm font-black text-ink mb-4">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-xs text-muted text-center py-4">No orders yet</p>
        ) : (
          <div className="divide-y divide-line/30">
            {recentOrders.map(order => {
              const dt = new Date(order.created_at * 1000);
              const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
              const dateStr = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
              const color = STATUS_COLORS[order.status] ?? '#9CA3AF';
              return (
                <div key={order.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-black text-ghost w-8 flex-shrink-0">#{order.id}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink truncate">Table: {order.table_number}</p>
                      <p className="text-[10px] text-muted">{dateStr} · {timeStr}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: `${color}18`, color }}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                    <span className="text-sm font-black text-ink">{fmtRupee(order.total_amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
