const db = require('./connection');

/*
  SCHEMA DESIGN NOTES
  ───────────────────
  Every tenant-scoped table (categories, items, orders, order_items)
  carries a cafe_id column and a composite index on (cafe_id, id).
  
  This means ALL queries that filter by cafe_id hit the index and never
  do a full table scan — critical for isolation AND performance as you
  scale to more cafes.

  Naming convention:
    - snake_case for all column names
    - All timestamps are Unix epoch integers (simpler than ISO strings in SQLite)
    - status columns use TEXT with CHECK constraints instead of enums
*/

const createTables = db.transaction(() => {

  // ── 1. CAFES ──────────────────────────────────────────────────────────────
  // One row per tenant. The slug is the public-facing identifier used in URLs
  // e.g. yourapp.com/menu/chai-corner-vadodara
  db.exec(`
    CREATE TABLE IF NOT EXISTS cafes (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      name                TEXT    NOT NULL,
      slug                TEXT    NOT NULL UNIQUE,       -- URL-safe: "chai-corner-vadodara"
      owner_name          TEXT    NOT NULL,
      email               TEXT    NOT NULL UNIQUE,
      password            TEXT    NOT NULL,              -- bcrypt hash, never plaintext
      phone               TEXT,
      logo_url            TEXT,                          -- Cloudinary URL
      address             TEXT,
      is_active           INTEGER NOT NULL DEFAULT 1,   -- 0 = suspended, 1 = active
      created_at          INTEGER NOT NULL DEFAULT (unixepoch()),
      reset_token         TEXT,
      reset_token_expires INTEGER
    );
  `);

  // Migrate existing databases safely
  try {
    db.exec(`ALTER TABLE cafes ADD COLUMN reset_token TEXT;`);
  } catch (err) {
    // Column already exists or table doesn't exist yet
  }

  try {
    db.exec(`ALTER TABLE cafes ADD COLUMN reset_token_expires INTEGER;`);
  } catch (err) {
    // Column already exists
  }

  // ── 2. CATEGORIES ─────────────────────────────────────────────────────────
  // e.g. "Breakfast", "Cold Drinks", "Snacks"
  // sort_order controls display sequence in the customer menu tab bar
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      cafe_id     INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
      name        TEXT    NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch()),

      UNIQUE(cafe_id, name)  -- Prevent duplicate category names within the same cafe
    );

    CREATE INDEX IF NOT EXISTS idx_categories_cafe
      ON categories(cafe_id, sort_order);
  `);

  // ── 3. ITEMS ──────────────────────────────────────────────────────────────
  // Menu items. is_available is the sold-out toggle the owner flips in real time.
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      cafe_id       INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
      category_id   INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      name          TEXT    NOT NULL,
      description   TEXT,
      price         REAL    NOT NULL CHECK(price >= 0),
      image_url     TEXT,                          -- Cloudinary URL
      is_veg        INTEGER NOT NULL DEFAULT 1,    -- 1 = veg (green dot), 0 = non-veg (red dot)
      is_available  INTEGER NOT NULL DEFAULT 1,    -- 0 = sold out, hidden from customer menu
      sort_order    INTEGER NOT NULL DEFAULT 0,
      created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),

      UNIQUE(cafe_id, name)  -- Prevent duplicate item names within the same cafe
    );

    -- Primary lookup: fetch all items for a cafe filtered by category
    CREATE INDEX IF NOT EXISTS idx_items_cafe_category
      ON items(cafe_id, category_id);

    -- Secondary lookup: owner dashboard listing all available items
    CREATE INDEX IF NOT EXISTS idx_items_cafe_available
      ON items(cafe_id, is_available);
  `);

  // ── 4. ORDERS ─────────────────────────────────────────────────────────────
  // One row per customer order submission.
  // table_number is free text — some cafes use "Table 4", others "Counter", others "Takeaway"
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      cafe_id       INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
      table_number  TEXT    NOT NULL,
      status        TEXT    NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
      total_amount  REAL    NOT NULL CHECK(total_amount >= 0),
      customer_note TEXT,                          -- "No sugar in chai please"
      created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
    );

    -- Kitchen queue: fetch today's active orders for a cafe, newest first
    CREATE INDEX IF NOT EXISTS idx_orders_cafe_status
      ON orders(cafe_id, status, created_at DESC);

    -- Analytics: fetch all orders for a cafe within a date range
    CREATE INDEX IF NOT EXISTS idx_orders_cafe_date
      ON orders(cafe_id, created_at DESC);
  `);

  // ── 5. ORDER_ITEMS ────────────────────────────────────────────────────────
  // Line items for each order. Denormalizes item name + price at order time
  // so historical orders stay accurate even if the owner later changes prices.
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      cafe_id       INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
      order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      item_id       INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
      item_name     TEXT    NOT NULL,   -- snapshot: price at time of order
      item_price    REAL    NOT NULL,   -- snapshot: name at time of order
      quantity      INTEGER NOT NULL CHECK(quantity > 0),
      subtotal      REAL    NOT NULL,   -- item_price * quantity, stored for fast analytics
      created_at    INTEGER NOT NULL DEFAULT (unixepoch())
    );

    -- Fetch all line items for a given order
    CREATE INDEX IF NOT EXISTS idx_order_items_order
      ON order_items(order_id);

    -- Analytics: aggregate sales per item for a cafe
    CREATE INDEX IF NOT EXISTS idx_order_items_cafe_item
      ON order_items(cafe_id, item_id);
  `);

  // ── 6. TABLE_SESSIONS ──────────────────────────────────────────────────────
  // Tracks active customer sessions per table.
  db.exec(`
    CREATE TABLE IF NOT EXISTS table_sessions (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      cafe_id       INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
      table_number  TEXT    NOT NULL,
      status        TEXT    NOT NULL DEFAULT 'active'
                    CHECK(status IN ('active', 'closed')),
      created_at    INTEGER NOT NULL DEFAULT (unixepoch())
    );

    -- Ensure only one active session exists per table at any given time for isolation
    CREATE UNIQUE INDEX IF NOT EXISTS idx_active_table_session
      ON table_sessions(cafe_id, table_number)
      WHERE status = 'active';
  `);

  // ── 7. SESSION_CART_ITEMS ──────────────────────────────────────────────────
  // Shared cart items associated with active table sessions.
  db.exec(`
    CREATE TABLE IF NOT EXISTS session_cart_items (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id        INTEGER NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
      item_id           INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
      item_name         TEXT    NOT NULL,
      item_price        REAL    NOT NULL,
      quantity          INTEGER NOT NULL CHECK(quantity > 0),
      added_by_device   TEXT    NOT NULL,
      added_at          INTEGER NOT NULL DEFAULT (unixepoch()),

      UNIQUE(session_id, item_id)
    );

    CREATE INDEX IF NOT EXISTS idx_session_cart_items_session
      ON session_cart_items(session_id);
  `);

});

// Run schema creation
createTables();
console.log('✓ Database schema ready');

// Auto-migration/seeding check for production deployment
try {
  const cafe = db.prepare("SELECT name FROM cafes ORDER BY id ASC LIMIT 1").get();
  const itemCount = db.prepare("SELECT COUNT(*) as count FROM items").get().count;
  
  if (!cafe || cafe.name !== 'Mélange Cafe & Lounge' || itemCount < 10) {
    console.log('⏳ Running auto-seeding migration for Mélange Cafe & Lounge menu...');
    require('./seed');
    console.log('✅ Auto-seeding migration complete!');
  }
} catch (err) {
  console.warn('Migration status:', err.message);
}

module.exports = db;
