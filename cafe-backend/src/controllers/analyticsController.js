const db = require('../db/connection');

/*
  ANALYTICS CONTROLLER
  ────────────────────
  GET /api/analytics?range=today|7d|30d|all
  
  Protected (owner JWT). Returns all dashboard analytics in a single
  response to avoid waterfall fetches on the frontend.

  All queries are scoped to req.cafe.id for multi-tenant isolation.
  Uses the pre-built indexes:
    - idx_orders_cafe_date        (orders by date)
    - idx_order_items_cafe_item   (item-level aggregations)
*/

const getAnalytics = (req, res, next) => {
  try {
    const cafeId = req.cafe.id;
    const range = req.query.range || '30d';

    // ── Compute epoch cutoff based on range param ──
    const now = Math.floor(Date.now() / 1000);
    let cutoff;
    if (range === 'today') {
      // Start of today (midnight local-ish, using UTC)
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      cutoff = Math.floor(d.getTime() / 1000);
    } else if (range === '7d') {
      cutoff = now - 7 * 24 * 3600;
    } else if (range === '30d') {
      cutoff = now - 30 * 24 * 3600;
    } else {
      cutoff = 0; // all time
    }

    // ── 1. SUMMARY STATS ──────────────────────────────────────────────────
    const summary = db.prepare(`
      SELECT
        COUNT(*)                                          AS total_orders,
        COALESCE(SUM(total_amount), 0)                   AS total_revenue,
        COALESCE(AVG(total_amount), 0)                   AS avg_order_value,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_orders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) AS completed_revenue
      FROM orders
      WHERE cafe_id = ? AND created_at >= ?
    `).get(cafeId, cutoff);

    // Today's snapshot (always "today", regardless of range filter)
    const todayStart = (() => {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      return Math.floor(d.getTime() / 1000);
    })();
    const todayStats = db.prepare(`
      SELECT
        COUNT(*)                          AS orders_today,
        COALESCE(SUM(total_amount), 0)    AS revenue_today
      FROM orders
      WHERE cafe_id = ? AND created_at >= ?
    `).get(cafeId, todayStart);

    // ── 2. REVENUE BY DAY (last N days, for bar chart) ────────────────────
    const revenueByDay = db.prepare(`
      SELECT
        DATE(created_at, 'unixepoch') AS day,
        COUNT(*)                       AS orders,
        COALESCE(SUM(total_amount), 0) AS revenue
      FROM orders
      WHERE cafe_id = ? AND created_at >= ?
      GROUP BY day
      ORDER BY day ASC
    `).all(cafeId, cutoff);

    // ── 3. BEST SELLERS (top 10 by quantity sold) ─────────────────────────
    const bestSellers = db.prepare(`
      SELECT
        oi.item_id,
        oi.item_name,
        SUM(oi.quantity)  AS total_qty,
        SUM(oi.subtotal)  AS total_revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.cafe_id = ? AND o.created_at >= ?
      GROUP BY oi.item_id
      ORDER BY total_qty DESC
      LIMIT 10
    `).all(cafeId, cutoff);

    // ── 4. LEAST ORDERED (bottom 10 by quantity sold) ─────────────────────
    const leastOrdered = db.prepare(`
      SELECT
        oi.item_id,
        oi.item_name,
        SUM(oi.quantity)  AS total_qty,
        SUM(oi.subtotal)  AS total_revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.cafe_id = ? AND o.created_at >= ?
      GROUP BY oi.item_id
      ORDER BY total_qty ASC
      LIMIT 10
    `).all(cafeId, cutoff);

    // ── 5. REVENUE BY CATEGORY ────────────────────────────────────────────
    const categoryRevenue = db.prepare(`
      SELECT
        c.name              AS category,
        SUM(oi.quantity)    AS total_qty,
        SUM(oi.subtotal)    AS total_revenue
      FROM order_items oi
      JOIN items it  ON it.id  = oi.item_id
      JOIN categories c ON c.id = it.category_id
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.cafe_id = ? AND o.created_at >= ?
      GROUP BY c.id
      ORDER BY total_revenue DESC
    `).all(cafeId, cutoff);

    // ── 6. ORDER STATUS BREAKDOWN ─────────────────────────────────────────
    const statusBreakdown = db.prepare(`
      SELECT
        status,
        COUNT(*) AS count
      FROM orders
      WHERE cafe_id = ? AND created_at >= ?
      GROUP BY status
    `).all(cafeId, cutoff);

    // ── 7. PEAK HOURS (0-23 hour distribution) ────────────────────────────
    const peakHours = db.prepare(`
      SELECT
        CAST(strftime('%H', created_at, 'unixepoch') AS INTEGER) AS hour,
        COUNT(*) AS orders
      FROM orders
      WHERE cafe_id = ? AND created_at >= ?
      GROUP BY hour
      ORDER BY hour ASC
    `).all(cafeId, cutoff);

    // ── 8. RECENT ORDERS (last 5, for activity feed) ──────────────────────
    const recentOrders = db.prepare(`
      SELECT id, table_number, status, total_amount, created_at
      FROM orders
      WHERE cafe_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `).all(cafeId);

    res.json({
      range,
      summary: { ...summary, ...todayStats },
      revenueByDay,
      bestSellers,
      leastOrdered,
      categoryRevenue,
      statusBreakdown,
      peakHours,
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAnalytics };
