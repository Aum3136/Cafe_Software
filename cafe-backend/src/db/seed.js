/*
  SEED SCRIPT
  Run with: npm run seed
  Creates 2 test cafes with categories, items, and sample orders.
  Safe to re-run — clears existing data first.
*/

require('dotenv').config();
require('./schema'); // Ensures tables exist before seeding
const db = require('./connection');
const bcrypt = require('bcryptjs');

const seed = db.transaction(() => {

  // Wipe in FK-safe order (children before parents)
  db.exec(`
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM items;
    DELETE FROM categories;
    DELETE FROM cafes;
  `);

  // ── Cafes ────────────────────────────────────────────────────────────────
  const password = bcrypt.hashSync('password123', 10);

  const insertCafe = db.prepare(`
    INSERT INTO cafes (name, slug, owner_name, email, password, phone, address)
    VALUES (@name, @slug, @owner_name, @email, @password, @phone, @address)
  `);

  const cafe1 = insertCafe.run({
    name: 'Chai Corner',
    slug: 'chai-corner',
    owner_name: 'Rahul Mehta',
    email: 'rahul@chaicorner.in',
    password,
    phone: '9876543210',
    address: 'Alkapuri, Vadodara'
  });

  const cafe2 = insertCafe.run({
    name: 'Brew House',
    slug: 'brew-house',
    owner_name: 'Priya Shah',
    email: 'priya@brewhouse.in',
    password,
    phone: '9876543211',
    address: 'Sayajigunj, Vadodara'
  });

  // ── Categories ───────────────────────────────────────────────────────────
  const insertCat = db.prepare(`
    INSERT INTO categories (cafe_id, name, sort_order)
    VALUES (@cafe_id, @name, @sort_order)
  `);

  // Cafe 1 categories
  const hotDrinks  = insertCat.run({ cafe_id: cafe1.lastInsertRowid, name: 'Hot Drinks',   sort_order: 1 });
  const coldDrinks = insertCat.run({ cafe_id: cafe1.lastInsertRowid, name: 'Cold Drinks',  sort_order: 2 });
  const snacks1    = insertCat.run({ cafe_id: cafe1.lastInsertRowid, name: 'Snacks',       sort_order: 3 });

  // Cafe 2 categories — completely separate, same category names are fine because cafe_id differs
  const coffee     = insertCat.run({ cafe_id: cafe2.lastInsertRowid, name: 'Coffee',       sort_order: 1 });
  const snacks2    = insertCat.run({ cafe_id: cafe2.lastInsertRowid, name: 'Snacks',       sort_order: 2 });

  // ── Items ────────────────────────────────────────────────────────────────
  const insertItem = db.prepare(`
    INSERT INTO items (cafe_id, category_id, name, description, price, is_veg, sort_order)
    VALUES (@cafe_id, @category_id, @name, @description, @price, @is_veg, @sort_order)
  `);

  const c1 = cafe1.lastInsertRowid;
  const c2 = cafe2.lastInsertRowid;

  // Cafe 1 items
  const masalaChai = insertItem.run({ cafe_id: c1, category_id: hotDrinks.lastInsertRowid,  name: 'Masala Chai',     description: 'Classic spiced tea with ginger',        price: 30,  is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: hotDrinks.lastInsertRowid,  name: 'Cutting Chai',    description: 'Strong small-glass chai',                price: 20,  is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: coldDrinks.lastInsertRowid, name: 'Cold Coffee',     description: 'Blended with ice and milk',              price: 80,  is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: coldDrinks.lastInsertRowid, name: 'Lemon Soda',      description: 'Fresh lime with soda',                   price: 50,  is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: snacks1.lastInsertRowid,    name: 'Samosa (2 pcs)',  description: 'Crispy with green chutney',              price: 25,  is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: snacks1.lastInsertRowid,    name: 'Bread Pakora',    description: 'Stuffed and fried',                      price: 40,  is_veg: 1, sort_order: 2 });

  // Cafe 2 items
  insertItem.run({ cafe_id: c2, category_id: coffee.lastInsertRowid,     name: 'Espresso',        description: 'Single shot, strong',                    price: 60,  is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c2, category_id: coffee.lastInsertRowid,     name: 'Cappuccino',      description: 'Espresso with steamed milk foam',        price: 110, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c2, category_id: coffee.lastInsertRowid,     name: 'Cold Brew',       description: 'Slow-steeped 12 hours',                  price: 130, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c2, category_id: snacks2.lastInsertRowid,    name: 'Croissant',       description: 'Buttery, baked fresh',                   price: 90,  is_veg: 1, sort_order: 1 });

  // ── Sample orders ────────────────────────────────────────────────────────
  const insertOrder = db.prepare(`
    INSERT INTO orders (cafe_id, table_number, status, total_amount, customer_note)
    VALUES (@cafe_id, @table_number, @status, @total_amount, @customer_note)
  `);
  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (cafe_id, order_id, item_id, item_name, item_price, quantity, subtotal)
    VALUES (@cafe_id, @order_id, @item_id, @item_name, @item_price, @quantity, @subtotal)
  `);

  // Order for Cafe 1: Table 3, 2x Masala Chai + 1x Samosa
  const order1 = insertOrder.run({
    cafe_id: c1, table_number: 'Table 3',
    status: 'pending', total_amount: 85, customer_note: 'Less sugar please'
  });
  insertOrderItem.run({ cafe_id: c1, order_id: order1.lastInsertRowid, item_id: masalaChai.lastInsertRowid, item_name: 'Masala Chai', item_price: 30, quantity: 2, subtotal: 60 });

  console.log('✓ Seed complete');
  console.log('  Cafe 1 — slug: chai-corner  | email: rahul@chaicorner.in | password: password123');
  console.log('  Cafe 2 — slug: brew-house   | email: priya@brewhouse.in  | password: password123');
});

seed();
