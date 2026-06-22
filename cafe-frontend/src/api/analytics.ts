const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export type AnalyticsRange = 'today' | '7d' | '30d' | 'all';

export interface AnalyticsSummary {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  completed_orders: number;
  cancelled_orders: number;
  completed_revenue: number;
  orders_today: number;
  revenue_today: number;
}

export interface RevenueByDay {
  day: string;       // 'YYYY-MM-DD'
  orders: number;
  revenue: number;
}

export interface ItemStat {
  item_id: number;
  item_name: string;
  total_qty: number;
  total_revenue: number;
}

export interface CategoryStat {
  category: string;
  total_qty: number;
  total_revenue: number;
}

export interface StatusStat {
  status: string;
  count: number;
}

export interface PeakHour {
  hour: number;    // 0–23
  orders: number;
}

export interface RecentOrder {
  id: number;
  table_number: string;
  status: string;
  total_amount: number;
  created_at: number;  // unix epoch
}

export interface AnalyticsData {
  range: AnalyticsRange;
  summary: AnalyticsSummary;
  revenueByDay: RevenueByDay[];
  bestSellers: ItemStat[];
  leastOrdered: ItemStat[];
  categoryRevenue: CategoryStat[];
  statusBreakdown: StatusStat[];
  peakHours: PeakHour[];
  recentOrders: RecentOrder[];
}

export async function fetchAnalytics(
  range: AnalyticsRange,
  token: string
): Promise<AnalyticsData> {
  const response = await fetch(`${BASE_URL}/api/analytics?range=${range}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json() as Promise<AnalyticsData>;
}
