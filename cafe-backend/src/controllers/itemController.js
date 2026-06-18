const db = require('../db/connection');

/*
  ITEMS CONTROLLER
  ────────────────
  All queries are scoped to req.cafe.id — set by authenticate middleware.
  This means a cafe owner can NEVER read, modify, or delete another cafe's items,
  even if they somehow guess a valid item ID.

  Rule: every SELECT / UPDATE / DELETE must have WHERE ... AND cafe_id = req.cafe.id
*/

// GET /api/items  — list all items for this cafe (owner dashboard)
const list = (req, res, next) => {
  try {
    const items = db.prepare(`
      SELECT i.*, c.name AS category_name
      FROM items i
      JOIN categories c ON c.id = i.category_id
      WHERE i.cafe_id = ?
      ORDER BY c.sort_order, i.sort_order, i.name
    `).all(req.cafe.id);

    res.json({ items });
  } catch (err) {
    next(err);
  }
};

// GET /api/menu/:slug  — public menu for customers (no auth required)
// This is called by the customer-facing React page
const publicMenu = (req, res, next) => {
  try {
    const cafe = db.prepare(
      'SELECT id, name, logo_url, address FROM cafes WHERE slug = ? AND is_active = 1'
    ).get(req.params.slug);

    if (!cafe) return res.status(404).json({ error: 'Cafe not found.' });

    const categories = db.prepare(`
      SELECT id, name, sort_order FROM categories
      WHERE cafe_id = ? AND is_active = 1
      ORDER BY sort_order
    `).all(cafe.id);

    const items = db.prepare(`
      SELECT id, category_id, name, description, price, image_url, is_veg, sort_order
      FROM items
      WHERE cafe_id = ? AND is_available = 1
      ORDER BY sort_order
    `).all(cafe.id);

    // Nest items under their category — saves the frontend a groupBy call
    const menu = categories.map(cat => ({
      ...cat,
      items: items.filter(item => item.category_id === cat.id)
    }));

    res.json({ cafe, menu });
  } catch (err) {
    next(err);
  }
};

// POST /api/items  — create a new item
const create = (req, res, next) => {
  try {
    const { category_id, name, description, price, is_veg, sort_order } = req.body;

    if (!category_id || !name || price === undefined) {
      return res.status(400).json({ error: 'category_id, name, and price are required.' });
    }

    // Verify the category actually belongs to this cafe before using it
    const cat = db.prepare(
      'SELECT id FROM categories WHERE id = ? AND cafe_id = ?'
    ).get(category_id, req.cafe.id);
    if (!cat) return res.status(400).json({ error: 'Category not found in your cafe.' });

    const stmt = db.prepare(`
      INSERT INTO items (cafe_id, category_id, name, description, price, is_veg, sort_order)
      VALUES (@cafe_id, @category_id, @name, @description, @price, @is_veg, @sort_order)
    `);
    const result = stmt.run({
      cafe_id: req.cafe.id, category_id, name, description: description || null,
      price, is_veg: is_veg ?? 1, sort_order: sort_order ?? 0
    });

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/items/:id  — update fields (also used for sold-out toggle)
const update = (req, res, next) => {
  try {
    const { id } = req.params;

    // Confirm ownership before touching anything
    const existing = db.prepare(
      'SELECT * FROM items WHERE id = ? AND cafe_id = ?'
    ).get(id, req.cafe.id);
    if (!existing) return res.status(404).json({ error: 'Item not found.' });

    // Only update fields that were actually sent in the request body
    const allowed = ['name', 'description', 'price', 'is_veg', 'is_available', 'sort_order', 'image_url', 'category_id'];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    updates.updated_at = Math.floor(Date.now() / 1000);
    updates.id = id;
    updates.cafe_id = req.cafe.id;

    const setClauses = Object.keys(updates)
      .filter(k => k !== 'id' && k !== 'cafe_id')
      .map(k => `${k} = @${k}`)
      .join(', ');

    db.prepare(
      `UPDATE items SET ${setClauses} WHERE id = @id AND cafe_id = @cafe_id`
    ).run(updates);

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.json({ item });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/items/:id
const remove = (req, res, next) => {
  try {
    const { id } = req.params;
    const result = db.prepare(
      'DELETE FROM items WHERE id = ? AND cafe_id = ?'
    ).run(id, req.cafe.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Item not found.' });
    res.json({ message: 'Item deleted.' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/items/:id/toggle-available  — PROTECTED (owner)
const toggleAvailable = (req, res, next) => {
  try {
    const { id } = req.params;
    const item = db.prepare('SELECT is_available FROM items WHERE id = ? AND cafe_id = ?').get(id, req.cafe.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    const newStatus = item.is_available === 1 ? 0 : 1;
    db.prepare('UPDATE items SET is_available = ?, updated_at = ? WHERE id = ? AND cafe_id = ?')
      .run(newStatus, Math.floor(Date.now() / 1000), id, req.cafe.id);

    res.json({ id: parseInt(id), is_available: newStatus });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, publicMenu, create, update, remove, toggleAvailable };
