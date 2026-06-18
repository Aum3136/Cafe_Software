const db = require('../db/connection');

// GET /api/categories
const list = (req, res, next) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(i.id) AS item_count
      FROM categories c
      LEFT JOIN items i ON i.category_id = c.id AND i.cafe_id = c.cafe_id
      WHERE c.cafe_id = ?
      GROUP BY c.id
      ORDER BY c.sort_order, c.name
    `).all(req.cafe.id);

    res.json({ categories });
  } catch (err) {
    next(err);
  }
};

// POST /api/categories
const create = (req, res, next) => {
  try {
    const { name, sort_order } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required.' });

    const result = db.prepare(`
      INSERT INTO categories (cafe_id, name, sort_order)
      VALUES (@cafe_id, @name, @sort_order)
    `).run({ cafe_id: req.cafe.id, name, sort_order: sort_order ?? 0 });

    const category = db.prepare('SELECT * FROM categories WHERE id = ?')
                       .get(result.lastInsertRowid);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/categories/:id
const update = (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sort_order, is_active } = req.body;

    const existing = db.prepare(
      'SELECT id FROM categories WHERE id = ? AND cafe_id = ?'
    ).get(id, req.cafe.id);
    if (!existing) return res.status(404).json({ error: 'Category not found.' });

    const updates = {};
    if (name !== undefined)       updates.name       = name;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    if (is_active !== undefined)  updates.is_active  = is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    updates.id      = id;
    updates.cafe_id = req.cafe.id;
    const setClauses = Object.keys(updates)
      .filter(k => k !== 'id' && k !== 'cafe_id')
      .map(k => `${k} = @${k}`)
      .join(', ');

    db.prepare(
      `UPDATE categories SET ${setClauses} WHERE id = @id AND cafe_id = @cafe_id`
    ).run(updates);

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.json({ category });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/categories/:id
// Will fail with FK error if category has items — intentional, handle on frontend with a warning
const remove = (req, res, next) => {
  try {
    const { id } = req.params;
    const result = db.prepare(
      'DELETE FROM categories WHERE id = ? AND cafe_id = ?'
    ).run(id, req.cafe.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Category not found.' });
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    next(err); // SQLITE_CONSTRAINT_FOREIGNKEY caught by global error handler
  }
};

module.exports = { list, create, update, remove };
