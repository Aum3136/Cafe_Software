/*
  SEED SCRIPT FOR THE NIRVAAN CAFE & LOUNGE
  Run with: npm run seed
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

  // ── 1. Cafes ────────────────────────────────────────────────────────────────
  const password = bcrypt.hashSync('password123', 10);

  const insertCafe = db.prepare(`
    INSERT INTO cafes (name, slug, owner_name, email, password, phone, address)
    VALUES (@name, @slug, @owner_name, @email, @password, @phone, @address)
  `);

  const cafe1 = insertCafe.run({
    name: 'The Nirvaan',
    slug: 'chai-corner',
    owner_name: 'Rahul Mehta',
    email: 'rahul@chaicorner.in',
    password,
    phone: '9876543210',
    address: 'Laxminarayan Club & Resort, Vadodara'
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

  const c1 = cafe1.lastInsertRowid;
  const c2 = cafe2.lastInsertRowid;

  // ── 2. Categories ───────────────────────────────────────────────────────────
  const insertCat = db.prepare(`
    INSERT INTO categories (cafe_id, name, sort_order)
    VALUES (@cafe_id, @name, @sort_order)
  `);

  // Cafe 1 (The Nirvaan) Categories
  const catRealSandwich = insertCat.run({ cafe_id: c1, name: 'The Real Sandwich',     sort_order: 1 });
  const catOnBread      = insertCat.run({ cafe_id: c1, name: 'On - Bread',             sort_order: 2 });
  const catPizza         = insertCat.run({ cafe_id: c1, name: 'Pizza (10 Inches)',     sort_order: 3 });
  const catSides         = insertCat.run({ cafe_id: c1, name: 'Sides',                 sort_order: 4 });
  const catOven          = insertCat.run({ cafe_id: c1, name: 'Fresh Out of the Oven', sort_order: 5 });
  const catHotBrew       = insertCat.run({ cafe_id: c1, name: 'Hot Brew',              sort_order: 6 });
  const catColdBrew      = insertCat.run({ cafe_id: c1, name: 'Cold Brew',             sort_order: 7 });
  const catCoolers       = insertCat.run({ cafe_id: c1, name: 'Coolers',               sort_order: 8 });
  const catShakes        = insertCat.run({ cafe_id: c1, name: 'Shakes',                sort_order: 9 });
  const catFrappes       = insertCat.run({ cafe_id: c1, name: 'Frappes',               sort_order: 10 });
  const catSipSavor      = insertCat.run({ cafe_id: c1, name: 'Sip & Savor',           sort_order: 11 });

  // Cafe 2 (Brew House) Categories
  const catCoffee2       = insertCat.run({ cafe_id: c2, name: 'Coffee',                 sort_order: 1 });
  const catSnacks2       = insertCat.run({ cafe_id: c2, name: 'Snacks',                 sort_order: 2 });

  // ── 3. Items ────────────────────────────────────────────────────────────────
  const insertItem = db.prepare(`
    INSERT INTO items (cafe_id, category_id, name, description, price, is_veg, sort_order)
    VALUES (@cafe_id, @category_id, @name, @description, @price, @is_veg, @sort_order)
  `);

  // ── Cafe 1: The Nirvaan Items (70 items) ──

  // The Real Sandwich (7 items)
  const idSand1 = insertItem.run({ cafe_id: c1, category_id: catRealSandwich.lastInsertRowid, name: 'Holly Molly Blueberry', description: 'A delicious combination of blueberry lime & cheese', price: 240, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catRealSandwich.lastInsertRowid, name: 'Creamy Mushroom', description: 'Every bite loaded with cheese mushroom & mayo', price: 200, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catRealSandwich.lastInsertRowid, name: 'Classic Italian', description: 'The classic Italian combination of tomato basil cheese', price: 200, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c1, category_id: catRealSandwich.lastInsertRowid, name: 'Creamy Tandoori Paneer', description: 'Delightful combination of delicious mayo and tangy paneer', price: 180, is_veg: 1, sort_order: 4 });
  insertItem.run({ cafe_id: c1, category_id: catRealSandwich.lastInsertRowid, name: 'Trinity Cheese Sandwich', description: 'The classic 3 cheese grill sandwich', price: 200, is_veg: 1, sort_order: 5 });
  insertItem.run({ cafe_id: c1, category_id: catRealSandwich.lastInsertRowid, name: 'Nutella Cheese', description: 'There are very few things as heavenly as nutella and cheese', price: 220, is_veg: 1, sort_order: 6 });
  insertItem.run({ cafe_id: c1, category_id: catRealSandwich.lastInsertRowid, name: 'Nutella Ba - Na - Na', description: 'Nutella and banana are something that go hand in hand', price: 200, is_veg: 1, sort_order: 7 });

  // On - Bread (4 items)
  insertItem.run({ cafe_id: c1, category_id: catOnBread.lastInsertRowid, name: 'The American One', description: 'Baked bean and cheese on toasts', price: 180, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catOnBread.lastInsertRowid, name: 'Loaded Mushroom', description: 'Creamy mushroom-garlic on toast', price: 180, is_veg: 1, sort_order: 2 });
  const idGarlicBread = insertItem.run({ cafe_id: c1, category_id: catOnBread.lastInsertRowid, name: 'The Classic Cheese & Garlic', description: 'Delicious cheesy garlic bread', price: 180, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c1, category_id: catOnBread.lastInsertRowid, name: 'The Trinity Cheese', description: 'A combination of 3 exquisite cheese spread on crispy toast', price: 180, is_veg: 1, sort_order: 4 });

  // Pizza (1 item)
  insertItem.run({ cafe_id: c1, category_id: catPizza.lastInsertRowid, name: 'Margherita Pizza', description: 'Classic mozzarella and tomato base pizza (10 inches)', price: 220, is_veg: 1, sort_order: 1 });

  // Sides (7 items)
  insertItem.run({ cafe_id: c1, category_id: catSides.lastInsertRowid, name: 'Peri Peri Fried Banana', description: 'Crispy fried banana with spicy peri-peri seasoning', price: 160, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catSides.lastInsertRowid, name: 'Classic Fries', description: 'Golden salted french fries', price: 140, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catSides.lastInsertRowid, name: 'Butter Garlic Fries', description: 'Tossed in garlic butter and parsley', price: 180, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c1, category_id: catSides.lastInsertRowid, name: 'Peri Peri Fries', description: 'Spicy peri-peri seasoned fries', price: 160, is_veg: 1, sort_order: 4 });
  insertItem.run({ cafe_id: c1, category_id: catSides.lastInsertRowid, name: 'Fully Loaded Fries', description: 'Fries topped with cheese, jalapenos and house sauce', price: 200, is_veg: 1, sort_order: 5 });
  insertItem.run({ cafe_id: c1, category_id: catSides.lastInsertRowid, name: 'Fully Loaded Nachos', description: 'Crispy nachos loaded with cheese sauce, salsa and sour cream', price: 240, is_veg: 1, sort_order: 6 });
  insertItem.run({ cafe_id: c1, category_id: catSides.lastInsertRowid, name: 'Classic Potato Wedges', description: 'Crispy seasoned potato wedges', price: 160, is_veg: 1, sort_order: 7 });

  // Fresh Out of the Oven (5 items)
  insertItem.run({ cafe_id: c1, category_id: catOven.lastInsertRowid, name: 'Apple Pie', description: 'Warm spiced apple filling in a flaky crust', price: 200, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catOven.lastInsertRowid, name: 'Cinnamon Rolls', description: 'Soft baked cinnamon rolls with sweet cream cheese icing', price: 200, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catOven.lastInsertRowid, name: 'Sizzling Walnut Brownie', description: 'Fudgy walnut brownie served sizzling with chocolate sauce', price: 220, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c1, category_id: catOven.lastInsertRowid, name: 'Pound Cakes', description: 'Rich buttery sponge cake - ask for today\'s flavor', price: 180, is_veg: 1, sort_order: 4 });
  insertItem.run({ cafe_id: c1, category_id: catOven.lastInsertRowid, name: 'Tea Cakes', description: 'Classic tea-time cake - ask for today\'s flavor', price: 180, is_veg: 1, sort_order: 5 });

  // Hot Brew (18 items)
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Espresso', description: 'Single shot of rich espresso', price: 100, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Espresso Con Panna', description: 'Espresso topped with a dollop of whipped cream', price: 140, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Espresso Affogato', description: 'Espresso shot poured over vanilla ice cream', price: 180, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Macchiato', description: 'Espresso marked with a splash of foamed milk', price: 120, is_veg: 1, sort_order: 4 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Cappuccino Regular', description: 'Classic espresso with balanced steamed milk and foam', price: 140, is_veg: 1, sort_order: 5 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Cappuccino Dry', description: 'Espresso with more foam and less steamed milk', price: 140, is_veg: 1, sort_order: 6 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Cafe Latte', description: 'Mild espresso coffee with velvety steamed milk', price: 140, is_veg: 1, sort_order: 7 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Nute - Latte', description: 'Creamy latte infused with delicious Nutella chocolate', price: 180, is_veg: 1, sort_order: 8 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Cafe Mocha', description: 'Espresso blended with rich chocolate and steamed milk', price: 160, is_veg: 1, sort_order: 9 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Americano', description: 'Espresso shots diluted with hot water', price: 120, is_veg: 1, sort_order: 10 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Honey Trap', description: 'Sweetened hot brew coffee with honey notes', price: 140, is_veg: 1, sort_order: 11 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Irish Coffee', description: 'Hot coffee with rich cream and non-alcoholic Irish flavor', price: 160, is_veg: 1, sort_order: 12 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Gourmet Hot Chocolate', description: 'Thick and rich premium hot chocolate', price: 160, is_veg: 1, sort_order: 13 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Irani Chai', description: 'Slow-brewed sweet milky Hyderabadi-style tea', price: 75, is_veg: 1, sort_order: 14 });
  const idMasalaChai = insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Masala Chai', description: 'Classic spiced tea with ginger and cardamom', price: 75, is_veg: 1, sort_order: 15 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Green Tea', description: 'Light antioxidant-rich hot green tea', price: 120, is_veg: 1, sort_order: 16 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Maska Bun', description: 'Soft bun loaded with sweet butter spread', price: 60, is_veg: 1, sort_order: 17 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Giant Chewy Cookies', description: 'Freshly baked giant chocolate chip cookie', price: 80, is_veg: 1, sort_order: 18 });

  // Cold Brew (6 items)
  insertItem.run({ cafe_id: c1, category_id: catColdBrew.lastInsertRowid, name: 'Iced Latte', description: 'Chilled espresso with fresh cold milk over ice', price: 160, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catColdBrew.lastInsertRowid, name: 'Iced Mocha', description: 'Chilled espresso with chocolate syrup and milk', price: 200, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catColdBrew.lastInsertRowid, name: 'Iced Americano', description: 'Chilled double shot of espresso diluted with cold water', price: 140, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c1, category_id: catColdBrew.lastInsertRowid, name: 'Honey Trap Cold Brew', description: 'Slow-steeped cold brew sweetened with premium honey', price: 140, is_veg: 1, sort_order: 4 });
  insertItem.run({ cafe_id: c1, category_id: catColdBrew.lastInsertRowid, name: 'Coffee on the Rocks', description: 'Strong unsweetened cold coffee poured over clean ice', price: 220, is_veg: 1, sort_order: 5 });
  insertItem.run({ cafe_id: c1, category_id: catColdBrew.lastInsertRowid, name: 'Vanilla Sweet Cream', description: 'Cold brew topped with vanilla sweet cream', price: 220, is_veg: 1, sort_order: 6 });

  // Coolers (6 items)
  insertItem.run({ cafe_id: c1, category_id: catCoolers.lastInsertRowid, name: 'Iced Tea', description: 'Refreshing iced tea - choose Lemon, Mint, Peach, or Strawberry', price: 180, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catCoolers.lastInsertRowid, name: 'Dew Drop Lemon', description: 'Chilled minty lemon cooler', price: 180, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catCoolers.lastInsertRowid, name: 'Morning Lemon Mint', description: 'Invigorating fresh lemon and mint refresher', price: 180, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c1, category_id: catCoolers.lastInsertRowid, name: 'Virgin Vodka Green Apple', description: 'Green apple cooler with clean mocktail flavors', price: 180, is_veg: 1, sort_order: 4 });
  insertItem.run({ cafe_id: c1, category_id: catCoolers.lastInsertRowid, name: 'Indian Summer Peach', description: 'Sweet peach mocktail blended with lime and soda', price: 180, is_veg: 1, sort_order: 5 });
  insertItem.run({ cafe_id: c1, category_id: catCoolers.lastInsertRowid, name: 'Berry Blitz Strawberry', description: 'Fruity strawberry mocktail blitzed with mint', price: 180, is_veg: 1, sort_order: 6 });

  // Shakes (8 items)
  insertItem.run({ cafe_id: c1, category_id: catShakes.lastInsertRowid, name: 'Chocolate Fuel', description: 'Double chocolate thick milkshake', price: 200, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catShakes.lastInsertRowid, name: 'Choco - Banana', description: 'Rich chocolate and fresh banana shake', price: 220, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catShakes.lastInsertRowid, name: 'Mighty Kit Kat', description: 'Kit Kat blended chocolate shake with toppings', price: 220, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c1, category_id: catShakes.lastInsertRowid, name: 'Oreo - Licious', description: 'Creamy vanilla shake blended with Oreo cookies', price: 200, is_veg: 1, sort_order: 4 });
  insertItem.run({ cafe_id: c1, category_id: catShakes.lastInsertRowid, name: 'Brownie Brownie', description: 'Decadent milkshake blended with chocolate fudge brownie', price: 220, is_veg: 1, sort_order: 5 });
  insertItem.run({ cafe_id: c1, category_id: catShakes.lastInsertRowid, name: 'Nutella Blast', description: 'Rich premium shake loaded with hazelnut Nutella spread', price: 280, is_veg: 1, sort_order: 6 });
  insertItem.run({ cafe_id: c1, category_id: catShakes.lastInsertRowid, name: 'Straw - Bana', description: 'Fresh strawberry and sweet banana shake', price: 230, is_veg: 1, sort_order: 7 });
  insertItem.run({ cafe_id: c1, category_id: catShakes.lastInsertRowid, name: 'Freaky Ferrero', description: 'Thick shake loaded with Ferrero Rocher chocolates', price: 280, is_veg: 1, sort_order: 8 });

  // Frappes (5 items)
  const idColdCoffee = insertItem.run({ cafe_id: c1, category_id: catFrappes.lastInsertRowid, name: 'Classic Blend Cold Coffee', description: 'Perfectly blended sweet frothy cold coffee', price: 200, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catFrappes.lastInsertRowid, name: 'Mocha Frappe', description: 'Blended cold coffee infused with rich chocolate drizzle', price: 220, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catFrappes.lastInsertRowid, name: 'Crazy Caramel', description: 'Sweet blended coffee with heavy caramel drizzle', price: 240, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c1, category_id: catFrappes.lastInsertRowid, name: 'Hazy Hazelnut', description: 'Blended coffee with nutty hazelnut syrup notes', price: 240, is_veg: 1, sort_order: 4 });
  insertItem.run({ cafe_id: c1, category_id: catFrappes.lastInsertRowid, name: 'Berry Strawberry Mocha', description: 'Strawberry-mocha blended coffee creation', price: 240, is_veg: 1, sort_order: 5 });

  // Sip & Savor (3 items)
  insertItem.run({ cafe_id: c1, category_id: catSipSavor.lastInsertRowid, name: 'Red Bull', description: 'Energy Drink', price: 140, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catSipSavor.lastInsertRowid, name: 'Ginger Ale', description: 'Carbonated ginger-flavored beverage', price: 140, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catSipSavor.lastInsertRowid, name: 'Tonic Water', description: 'Classic carbonated mixer', price: 140, is_veg: 1, sort_order: 3 });


  // ── Cafe 2: Brew House Items (Keep basic) ──
  const idEspresso2 = insertItem.run({ cafe_id: c2, category_id: catCoffee2.lastInsertRowid, name: 'Espresso', description: 'Single shot, strong', price: 60, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c2, category_id: catCoffee2.lastInsertRowid, name: 'Cappuccino', description: 'Espresso with steamed milk foam', price: 110, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c2, category_id: catCoffee2.lastInsertRowid, name: 'Cold Brew', description: 'Slow-steeped 12 hours', price: 130, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c2, category_id: catSnacks2.lastInsertRowid,    name: 'Croissant', description: 'Buttery, baked fresh', price: 90, is_veg: 1, sort_order: 1 });


  // ── 4. Sample Orders ────────────────────────────────────────────────────────
  const insertOrder = db.prepare(`
    INSERT INTO orders (cafe_id, table_number, status, total_amount, customer_note)
    VALUES (@cafe_id, @table_number, @status, @total_amount, @customer_note)
  `);
  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (cafe_id, order_id, item_id, item_name, item_price, quantity, subtotal)
    VALUES (@cafe_id, @order_id, @item_id, @item_name, @item_price, @quantity, @subtotal)
  `);

  // Order for Cafe 1: Table 3, 2x Masala Chai + 1x Garlic Bread
  const order1 = insertOrder.run({
    cafe_id: c1, table_number: 'Table 3',
    status: 'pending', total_amount: 330, customer_note: 'Less sugar in chai'
  });
  insertOrderItem.run({ cafe_id: c1, order_id: order1.lastInsertRowid, item_id: idMasalaChai.lastInsertRowid, item_name: 'Masala Chai', item_price: 75, quantity: 2, subtotal: 150 });
  insertOrderItem.run({ cafe_id: c1, order_id: order1.lastInsertRowid, item_id: idGarlicBread.lastInsertRowid, item_name: 'The Classic Cheese & Garlic', item_price: 180, quantity: 1, subtotal: 180 });

  console.log('✓ Seed complete');
  console.log('  Cafe 1 — slug: chai-corner  | email: rahul@chaicorner.in | password: password123');
  console.log('  Cafe 2 — slug: brew-house   | email: priya@brewhouse.in  | password: password123');
});

seed();
