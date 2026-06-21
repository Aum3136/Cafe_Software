const db = require('../db/connection');

// Helper to get active session or create it
function getOrCreateActiveSession(cafeId, tableNumber) {
  // Try to find active session
  let session = db.prepare(`
    SELECT * FROM table_sessions
    WHERE cafe_id = ? AND table_number = ? AND status = 'active'
  `).get(cafeId, tableNumber);

  if (!session) {
    const result = db.prepare(`
      INSERT INTO table_sessions (cafe_id, table_number, status)
      VALUES (?, ?, 'active')
    `).run(cafeId, tableNumber);
    
    session = db.prepare(`
      SELECT * FROM table_sessions WHERE id = ?
    `).get(result.lastInsertRowid);
  }
  
  return session;
}

// GET /api/table-session/:cafeSlug/:tableNumber
const getSession = (req, res, next) => {
  try {
    const { cafeSlug, tableNumber } = req.params;

    const cafe = db.prepare('SELECT id FROM cafes WHERE slug = ? AND is_active = 1').get(cafeSlug);
    if (!cafe) return res.status(404).json({ error: 'Cafe not found.' });

    const session = getOrCreateActiveSession(cafe.id, tableNumber);

    // Fetch items with extra details from items table
    const items = db.prepare(`
      SELECT sci.*, i.is_veg, i.image_url
      FROM session_cart_items sci
      JOIN items i ON sci.item_id = i.id
      WHERE sci.session_id = ?
    `).all(session.id);

    res.json({ session, items });
  } catch (err) {
    next(err);
  }
};

// POST /api/table-session/:cafeSlug/:tableNumber/items
const addItem = (req, res, next) => {
  try {
    const { cafeSlug, tableNumber } = req.params;
    const { item_id, quantity, device_label } = req.body;

    if (!item_id || !quantity || !device_label) {
      return res.status(400).json({ error: 'item_id, quantity, and device_label are required.' });
    }

    const cafe = db.prepare('SELECT id FROM cafes WHERE slug = ? AND is_active = 1').get(cafeSlug);
    if (!cafe) return res.status(404).json({ error: 'Cafe not found.' });

    // Validate item exists, is active, and belongs to cafe
    const item = db.prepare(`
      SELECT id, name, price FROM items
      WHERE id = ? AND cafe_id = ? AND is_available = 1
    `).get(item_id, cafe.id);

    if (!item) {
      return res.status(400).json({ error: 'Item not found or unavailable at this cafe.' });
    }

    const session = getOrCreateActiveSession(cafe.id, tableNumber);

    // Consolidated transaction to add or update
    const upsertItem = db.transaction(() => {
      const existing = db.prepare(`
        SELECT id, quantity FROM session_cart_items
        WHERE session_id = ? AND item_id = ?
      `).get(session.id, item.id);

      if (existing) {
        db.prepare(`
          UPDATE session_cart_items
          SET quantity = quantity + ?, added_by_device = ?, added_at = (unixepoch())
          WHERE id = ?
        `).run(quantity, device_label, existing.id);
      } else {
        db.prepare(`
          INSERT INTO session_cart_items (session_id, item_id, item_name, item_price, quantity, added_by_device)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(session.id, item.id, item.name, item.price, quantity, device_label);
      }
    });

    upsertItem();

    // Fetch updated list of items to return
    const items = db.prepare(`
      SELECT sci.*, i.is_veg, i.image_url
      FROM session_cart_items sci
      JOIN items i ON sci.item_id = i.id
      WHERE sci.session_id = ?
    `).all(session.id);

    res.json({ message: 'Item added successfully', items });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/table-session/:cafeSlug/:tableNumber/items/:itemId
const removeItem = (req, res, next) => {
  try {
    const { cafeSlug, tableNumber, itemId } = req.params;

    const cafe = db.prepare('SELECT id FROM cafes WHERE slug = ? AND is_active = 1').get(cafeSlug);
    if (!cafe) return res.status(404).json({ error: 'Cafe not found.' });

    const session = db.prepare(`
      SELECT id FROM table_sessions
      WHERE cafe_id = ? AND table_number = ? AND status = 'active'
    `).get(cafe.id, tableNumber);

    if (!session) {
      return res.status(404).json({ error: 'No active session found for this table.' });
    }

    const decrementOrDelete = db.transaction(() => {
      const existing = db.prepare(`
        SELECT id, quantity FROM session_cart_items
        WHERE session_id = ? AND item_id = ?
      `).get(session.id, itemId);

      if (existing) {
        if (existing.quantity > 1) {
          db.prepare(`
            UPDATE session_cart_items
            SET quantity = quantity - 1
            WHERE id = ?
          `).run(existing.id);
        } else {
          db.prepare(`
            DELETE FROM session_cart_items
            WHERE id = ?
          `).run(existing.id);
        }
      }
    });

    decrementOrDelete();

    // Fetch updated list of items to return
    const items = db.prepare(`
      SELECT sci.*, i.is_veg, i.image_url
      FROM session_cart_items sci
      JOIN items i ON sci.item_id = i.id
      WHERE sci.session_id = ?
    `).all(session.id);

    res.json({ message: 'Item decremented/removed successfully', items });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSession, addItem, removeItem };
