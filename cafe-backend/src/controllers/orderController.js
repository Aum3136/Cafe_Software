const db = require('../db/connection');

/*
  ORDERS CONTROLLER
  ─────────────────
  Two audiences:
    1. Customer (no auth): POST /api/orders — place a new order
    2. Owner (authenticated): GET /api/orders — view kitchen queue
                              PATCH /api/orders/:id/status — update order status
*/

// POST /api/orders  — PUBLIC, no auth
// Called when customer taps "Place Order" on their phone
const placeOrder = (req, res, next) => {
  try {
    const { cafe_slug, table_number, items, customer_note } = req.body;

    if (!cafe_slug || !table_number || !items || !items.length) {
      return res.status(400).json({ error: 'cafe_slug, table_number, and items are required.' });
    }

    const cafe = db.prepare(
      'SELECT id FROM cafes WHERE slug = ? AND is_active = 1'
    ).get(cafe_slug);
    if (!cafe) return res.status(404).json({ error: 'Cafe not found.' });

    // Validate all item IDs belong to this cafe and are available
    const itemIds = items.map(i => i.item_id);
    const placeholders = itemIds.map(() => '?').join(', ');
    const dbItems = db.prepare(`
      SELECT id, name, price FROM items
      WHERE id IN (${placeholders}) AND cafe_id = ? AND is_available = 1
    `).all(...itemIds, cafe.id);

    if (dbItems.length !== itemIds.length) {
      return res.status(400).json({
        error: 'One or more items are unavailable or do not belong to this cafe.'
      });
    }

    // Build a lookup map for quick price retrieval
    const itemMap = Object.fromEntries(dbItems.map(i => [i.id, i]));

    // Calculate total server-side — never trust client-sent prices
    let total_amount = 0;
    const orderLines = items.map(({ item_id, quantity }) => {
      const dbItem = itemMap[item_id];
      const subtotal = dbItem.price * quantity;
      total_amount += subtotal;
      return { item_id, item_name: dbItem.name, item_price: dbItem.price, quantity, subtotal };
    });

    // Wrap order + line items in a single transaction — both succeed or both fail
    const createOrder = db.transaction(() => {
      const order = db.prepare(`
        INSERT INTO orders (cafe_id, table_number, total_amount, customer_note)
        VALUES (@cafe_id, @table_number, @total_amount, @customer_note)
      `).run({
        cafe_id: cafe.id, table_number,
        total_amount: parseFloat(total_amount.toFixed(2)),
        customer_note: customer_note || null
      });

      const insertLine = db.prepare(`
        INSERT INTO order_items (cafe_id, order_id, item_id, item_name, item_price, quantity, subtotal)
        VALUES (@cafe_id, @order_id, @item_id, @item_name, @item_price, @quantity, @subtotal)
      `);
      for (const line of orderLines) {
        insertLine.run({ cafe_id: cafe.id, order_id: order.lastInsertRowid, ...line });
      }

      return order.lastInsertRowid;
    });

    const orderId = createOrder();
    res.status(201).json({
      message: 'Order placed successfully!',
      order_id: orderId,
      table_number,
      total_amount: parseFloat(total_amount.toFixed(2))
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders  — PROTECTED (owner)
// Returns active orders for the kitchen queue. Polled every 5 seconds by the frontend.
// Optional query: ?status=pending,confirmed,preparing  (defaults to active statuses)
const listOrders = (req, res, next) => {
  try {
    const statusFilter = req.query.status
      ? req.query.status.split(',')
      : ['pending', 'confirmed', 'preparing'];

    const placeholders = statusFilter.map(() => '?').join(', ');
    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE cafe_id = ? AND status IN (${placeholders})
      ORDER BY created_at DESC
    `).all(req.cafe.id, ...statusFilter);

    // Attach line items to each order
    const orderIds = orders.map(o => o.id);
    let orderItems = [];
    if (orderIds.length > 0) {
      const p2 = orderIds.map(() => '?').join(', ');
      orderItems = db.prepare(`
        SELECT * FROM order_items WHERE order_id IN (${p2})
      `).all(...orderIds);
    }

    const itemsByOrder = {};
    for (const item of orderItems) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push(item);
    }

    const result = orders.map(o => ({ ...o, items: itemsByOrder[o.id] || [] }));
    res.json({ orders: result });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/status  — PROTECTED (owner)
// Owner taps "Confirm", "Ready", "Complete" on the kitchen screen
const updateStatus = (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const valid = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });
    }

    const result = db.prepare(`
      UPDATE orders
      SET status = @status, updated_at = @updated_at
      WHERE id = @id AND cafe_id = @cafe_id
    `).run({
      status, id, cafe_id: req.cafe.id,
      updated_at: Math.floor(Date.now() / 1000)
    });

    if (result.changes === 0) return res.status(404).json({ error: 'Order not found.' });

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

module.exports = { placeOrder, listOrders, updateStatus };
