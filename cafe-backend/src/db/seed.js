/*
  SEED SCRIPT FOR MÉLANGE CAFE & LOUNGE
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
    DELETE FROM session_cart_items;
    DELETE FROM table_sessions;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM items;
    DELETE FROM categories;
    DELETE FROM cafes;
    DELETE FROM sqlite_sequence;
  `);

  // ── 1. Cafes ────────────────────────────────────────────────────────────────
  const password = bcrypt.hashSync('password123', 10);

  const insertCafe = db.prepare(`
    INSERT INTO cafes (name, slug, owner_name, email, password, phone, address)
    VALUES (@name, @slug, @owner_name, @email, @password, @phone, @address)
  `);

  const cafe1 = insertCafe.run({
    name: 'Mélange Cafe & Lounge',
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

  // Cafe 1 (Mélange Cafe & Lounge) Categories
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

  // Unsplash CDN stable food photography URLs
  const imgChai = 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&h=400&fit=crop&q=80';
  const imgSamosa = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop&q=80';
  const imgColdCoffee = 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400&h=400&fit=crop&q=80';
  const imgSandwich = 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop&q=80';
  const imgLemonade = 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&h=400&fit=crop&q=80';

  const insertItemStmt = db.prepare(`
    INSERT INTO items (cafe_id, category_id, name, description, price, image_url, is_veg, sort_order)
    VALUES (@cafe_id, @category_id, @name, @description, @price, @image_url, @is_veg, @sort_order)
  `);
  const insertItem = {
    run(args) {
      const { is_popular, ...rest } = args;
      const result = insertItemStmt.run(rest);
      if (is_popular !== undefined) {
        db.prepare('UPDATE items SET is_popular = ? WHERE id = ?').run(is_popular, result.lastInsertRowid);
      }
      return result;
    }
  };

  // ── Cafe 1: Mélange Cafe & Lounge Items (70 items) ──

  // The Real Sandwich (7 items)
  const idSand1 = insertItem.run({ cafe_id: c1, category_id: catRealSandwich.lastInsertRowid, name: 'Holly Molly Blueberry', description: 'Blueberry, lime & cheese grill — sweet, tangy, ekdum unique.', price: 240, image_url: imgSandwich, is_veg: 1, sort_order: 1, is_popular: 1 });
  insertItem.run({ cafe_id: c1, category_id: catRealSandwich.lastInsertRowid, name: 'Creamy Mushroom', description: 'Mushrooms and loaded cheese, toasted till super melty.', price: 200, image_url: imgSandwich, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catRealSandwich.lastInsertRowid, name: 'Classic Italian', description: 'Tomato, fresh basil, and gooey cheese. A simple Italian love affair.', price: 200, image_url: imgSandwich, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c1, category_id: catRealSandwich.lastInsertRowid, name: 'Creamy Tandoori Paneer', description: 'Tandoori-spiced paneer with creamy mayo. Chatpata and filling!', price: 180, image_url: imgSandwich, is_veg: 1, sort_order: 4 });
  insertItem.run({ cafe_id: c1, category_id: catRealSandwich.lastInsertRowid, name: 'Trinity Cheese Sandwich', description: 'Triple cheese goodness. Crispy on the outside, cheesy inside.', price: 200, image_url: imgSandwich, is_veg: 1, sort_order: 5 });
  insertItem.run({ cafe_id: c1, category_id: catRealSandwich.lastInsertRowid, name: 'Nutella Cheese', description: 'Nutella meets melted cheese. Sounds crazy, tastes like heaven!', price: 220, image_url: imgSandwich, is_veg: 1, sort_order: 6 });
  insertItem.run({ cafe_id: c1, category_id: catRealSandwich.lastInsertRowid, name: 'Nutella Ba - Na - Na', description: 'Nutella and fresh banana. The ultimate sweet comfort food.', price: 200, image_url: imgSandwich, is_veg: 1, sort_order: 7 });

  // On - Bread (4 items)
  insertItem.run({ cafe_id: c1, category_id: catOnBread.lastInsertRowid, name: 'The American One', description: 'Warm baked beans and cheese on toast. Comforting American classic.', price: 180, image_url: imgSandwich, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catOnBread.lastInsertRowid, name: 'Loaded Mushroom', description: 'Creamy garlic mushrooms piled high on toasted bread.', price: 180, image_url: imgSandwich, is_veg: 1, sort_order: 2 });
  const idGarlicBread = insertItem.run({ cafe_id: c1, category_id: catOnBread.lastInsertRowid, name: 'The Classic Cheese & Garlic', description: 'Melted cheese and fresh garlic butter on crispy toast. Hard to resist!', price: 180, image_url: imgSandwich, is_veg: 1, sort_order: 3, is_popular: 1 });
  insertItem.run({ cafe_id: c1, category_id: catOnBread.lastInsertRowid, name: 'The Trinity Cheese', description: 'Our signature three-cheese spread on hot crispy toast.', price: 180, image_url: imgSandwich, is_veg: 1, sort_order: 4 });

  // Pizza (1 item)
  insertItem.run({ cafe_id: c1, category_id: catPizza.lastInsertRowid, name: 'Margherita Pizza', description: 'Classic mozzarella and tomato base. Simple, fresh, ekdum perfect.', price: 220, image_url: imgSandwich, is_veg: 1, sort_order: 1 });

  // Sides (7 items)
  insertItem.run({ cafe_id: c1, category_id: catSides.lastInsertRowid, name: 'Peri Peri Fried Banana', description: 'Sweet banana slices fried crispy with a spicy peri-peri twist.', price: 160, image_url: imgSamosa, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catSides.lastInsertRowid, name: 'Classic Fries', description: 'Crispy, golden potato fries. Simple, salted, and always hot.', price: 140, image_url: imgSamosa, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catSides.lastInsertRowid, name: 'Butter Garlic Fries', description: 'Golden fries tossed in warm garlic butter. Super aromatic, bhai.', price: 180, image_url: imgSamosa, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c1, category_id: catSides.lastInsertRowid, name: 'Peri Peri Fries', description: 'Fries dusted with our special spicy, tangy peri-peri masala.', price: 160, image_url: imgSamosa, is_veg: 1, sort_order: 4 });
  insertItem.run({ cafe_id: c1, category_id: catSides.lastInsertRowid, name: 'Fully Loaded Fries', description: 'Fries smothered in hot cheese sauce, jalapeños, and secret seasoning.', price: 200, image_url: imgSamosa, is_veg: 1, sort_order: 5 });
  insertItem.run({ cafe_id: c1, category_id: catSides.lastInsertRowid, name: 'Fully Loaded Nachos', description: 'Crispy nachos loaded with warm cheese, salsa, and sour cream.', price: 240, image_url: imgSamosa, is_veg: 1, sort_order: 6 });
  insertItem.run({ cafe_id: c1, category_id: catSides.lastInsertRowid, name: 'Classic Potato Wedges', description: 'Crispy seasoned potato wedges, served hot and fresh.', price: 160, image_url: imgSamosa, is_veg: 1, sort_order: 7 });

  // Fresh Out of the Oven (5 items)
  insertItem.run({ cafe_id: c1, category_id: catOven.lastInsertRowid, name: 'Apple Pie', description: 'Flaky crust loaded with warm spiced apples. Dadi-approved sweetness.', price: 200, image_url: imgSamosa, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catOven.lastInsertRowid, name: 'Cinnamon Rolls', description: 'Soft, warm rolls glazed with sweet cream cheese icing.', price: 200, image_url: imgSamosa, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catOven.lastInsertRowid, name: 'Sizzling Walnut Brownie', description: 'Fudgy brownie served hot and sizzling with warm chocolate fudge.', price: 220, image_url: imgSamosa, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c1, category_id: catOven.lastInsertRowid, name: 'Pound Cakes', description: 'Buttery, rich pound cake slice. Goes best with garam chai.', price: 180, image_url: imgSamosa, is_veg: 1, sort_order: 4 });
  insertItem.run({ cafe_id: c1, category_id: catOven.lastInsertRowid, name: 'Tea Cakes', description: 'Light, fresh tea cake. Baked fresh in our kitchen daily.', price: 180, image_url: imgSamosa, is_veg: 1, sort_order: 5 });

  // Hot Brew (18 items)
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Espresso', description: 'A bold, intense shot of pure espresso. Straight to the point.', price: 100, image_url: imgChai, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Espresso Con Panna', description: 'Bold espresso topped with a dollop of fresh whipped cream.', price: 140, image_url: imgChai, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Espresso Affogato', description: 'Rich espresso shot poured over creamy vanilla ice cream.', price: 180, image_url: imgChai, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Macchiato', description: 'Bold espresso marked with a delicate splash of warm foam.', price: 120, image_url: imgChai, is_veg: 1, sort_order: 4 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Cappuccino Regular', description: 'Espresso with balanced steamed milk and a beautiful layer of foam.', price: 140, image_url: imgChai, is_veg: 1, sort_order: 5 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Cappuccino Dry', description: 'More foam, less milk. For the true espresso lovers.', price: 140, image_url: imgChai, is_veg: 1, sort_order: 6 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Cafe Latte', description: 'Smooth espresso with velvety steamed milk. Mild and comforting.', price: 140, image_url: imgChai, is_veg: 1, sort_order: 7 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Nute - Latte', description: 'Our creamy latte infused with thick, hazelnut Nutella spread.', price: 180, image_url: imgChai, is_veg: 1, sort_order: 8 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Cafe Mocha', description: 'Rich chocolate and bold espresso, topped with silky steamed milk.', price: 160, image_url: imgChai, is_veg: 1, sort_order: 9 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Americano', description: 'Double shot of espresso diluted with hot water. Clean brew.', price: 120, image_url: imgChai, is_veg: 1, sort_order: 10 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Honey Trap', description: 'Bold espresso sweetened with pure, local organic honey.', price: 140, image_url: imgChai, is_veg: 1, sort_order: 11 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Irish Coffee', description: 'A warm coffee treat infused with non-alcoholic Irish cream.', price: 160, image_url: imgChai, is_veg: 1, sort_order: 12 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Gourmet Hot Chocolate', description: 'Thick, rich, and velvety premium chocolate. Warm hug in a mug.', price: 160, image_url: imgChai, is_veg: 1, sort_order: 13 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Irani Chai', description: 'Slow-brewed sweet, milky chai. Nostalgic tapri flavor, pure love.', price: 75, image_url: imgChai, is_veg: 1, sort_order: 14 });
  const idMasalaChai = insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Masala Chai', description: 'Our tapri-style chai, extra adrak, no shortcuts.', price: 75, image_url: imgChai, is_veg: 1, sort_order: 15 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Green Tea', description: 'Light, clean, and antioxidant-rich green tea to refresh you.', price: 120, image_url: imgChai, is_veg: 1, sort_order: 16 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Maska Bun', description: 'Soft bun sliced and loaded with sweet maska. Classic chai partner!', price: 60, image_url: imgChai, is_veg: 1, sort_order: 17 });
  insertItem.run({ cafe_id: c1, category_id: catHotBrew.lastInsertRowid, name: 'Giant Chewy Cookies', description: 'Freshly baked giant chocolate chip cookie. Soft and chewy.', price: 80, image_url: imgChai, is_veg: 1, sort_order: 18 });

  // Cold Brew (6 items)
  insertItem.run({ cafe_id: c1, category_id: catColdBrew.lastInsertRowid, name: 'Iced Latte', description: 'Chilled espresso and cold milk served over ice.', price: 160, image_url: imgColdCoffee, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catColdBrew.lastInsertRowid, name: 'Iced Mocha', description: 'Chilled espresso, rich chocolate, and cold milk over ice.', price: 200, image_url: imgColdCoffee, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catColdBrew.lastInsertRowid, name: 'Iced Americano', description: 'Espresso double shot served chilled over ice. Ekdum refreshing.', price: 140, image_url: imgColdCoffee, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c1, category_id: catColdBrew.lastInsertRowid, name: 'Honey Trap Cold Brew', description: 'Slow-steeped cold brew with a sweet kiss of pure honey.', price: 140, image_url: imgColdCoffee, is_veg: 1, sort_order: 4 });
  insertItem.run({ cafe_id: c1, category_id: catColdBrew.lastInsertRowid, name: 'Coffee on the Rocks', description: 'Bold, unsweetened cold brew poured over clean, solid ice.', price: 220, image_url: imgColdCoffee, is_veg: 1, sort_order: 5 });
  insertItem.run({ cafe_id: c1, category_id: catColdBrew.lastInsertRowid, name: 'Vanilla Sweet Cream', description: 'Smooth cold brew topped with house-made vanilla sweet cream.', price: 220, image_url: imgColdCoffee, is_veg: 1, sort_order: 6 });

  // Coolers (6 items)
  insertItem.run({ cafe_id: c1, category_id: catCoolers.lastInsertRowid, name: 'Iced Tea', description: 'Refreshing iced tea. Pick Lemon, Mint, Peach, or Strawberry.', price: 180, image_url: imgLemonade, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catCoolers.lastInsertRowid, name: 'Dew Drop Lemon', description: 'Chilled lemon cooler with a fresh splash of mint.', price: 180, image_url: imgLemonade, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catCoolers.lastInsertRowid, name: 'Morning Lemon Mint', description: 'Zesty lemon and fresh mint. The ultimate morning booster!', price: 180, image_url: imgLemonade, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c1, category_id: catCoolers.lastInsertRowid, name: 'Virgin Vodka Green Apple', description: 'Crisp green apple cooler. Sweet, sour, and ekdum chilled.', price: 180, image_url: imgLemonade, is_veg: 1, sort_order: 4 });
  insertItem.run({ cafe_id: c1, category_id: catCoolers.lastInsertRowid, name: 'Indian Summer Peach', description: 'Sweet peach blended with fresh lime and bubbly soda.', price: 180, image_url: imgLemonade, is_veg: 1, sort_order: 5 });
  insertItem.run({ cafe_id: c1, category_id: catCoolers.lastInsertRowid, name: 'Berry Blitz Strawberry', description: 'Fruity strawberry mocktail blitzed with fresh mint leaves.', price: 180, image_url: imgLemonade, is_veg: 1, sort_order: 6 });

  // Shakes (8 items)
  insertItem.run({ cafe_id: c1, category_id: catShakes.lastInsertRowid, name: 'Chocolate Fuel', description: 'Double chocolate milkshake, blended thick and creamy.', price: 200, image_url: imgColdCoffee, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catShakes.lastInsertRowid, name: 'Choco - Banana', description: 'Creamy milkshake with rich chocolate and fresh banana slices.', price: 220, image_url: imgColdCoffee, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catShakes.lastInsertRowid, name: 'Mighty Kit Kat', description: 'Chocolate shake blended with Kit Kat. A child-at-heart treat.', price: 220, image_url: imgColdCoffee, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c1, category_id: catShakes.lastInsertRowid, name: 'Oreo - Licious', description: 'Thick milkshake blended with crunchy Oreo cookies. A sweet crunch.', price: 200, image_url: imgColdCoffee, is_veg: 1, sort_order: 4 });
  insertItem.run({ cafe_id: c1, category_id: catShakes.lastInsertRowid, name: 'Brownie Brownie', description: 'Decadent milkshake blended with chocolate fudge brownie chunks.', price: 220, image_url: imgColdCoffee, is_veg: 1, sort_order: 5 });
  insertItem.run({ cafe_id: c1, category_id: catShakes.lastInsertRowid, name: 'Nutella Blast', description: 'Premium thick shake loaded with rich hazelnut Nutella spread.', price: 280, image_url: imgColdCoffee, is_veg: 1, sort_order: 6 });
  insertItem.run({ cafe_id: c1, category_id: catShakes.lastInsertRowid, name: 'Straw - Bana', description: 'Sweet strawberries and fresh bananas blended into thick perfection.', price: 230, image_url: imgColdCoffee, is_veg: 1, sort_order: 7 });
  insertItem.run({ cafe_id: c1, category_id: catShakes.lastInsertRowid, name: 'Freaky Ferrero', description: 'Thick milkshake loaded with crunchy Ferrero Rocher chocolates.', price: 280, image_url: imgColdCoffee, is_veg: 1, sort_order: 8 });

  // Frappes (5 items)
  const idColdCoffee = insertItem.run({ cafe_id: c1, category_id: catFrappes.lastInsertRowid, name: 'Classic Blend Cold Coffee', description: 'Cold coffee the way Vadodara likes it — thick and sweet.', price: 200, image_url: imgColdCoffee, is_veg: 1, sort_order: 1, is_popular: 1 });
  insertItem.run({ cafe_id: c1, category_id: catFrappes.lastInsertRowid, name: 'Mocha Frappe', description: 'Blended cold coffee infused with rich chocolate syrup.', price: 220, image_url: imgColdCoffee, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catFrappes.lastInsertRowid, name: 'Crazy Caramel', description: 'Sweet blended coffee with a warm caramel drizzle.', price: 240, image_url: imgColdCoffee, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c1, category_id: catFrappes.lastInsertRowid, name: 'Hazy Hazelnut', description: 'Creamy cold coffee with nutty hazelnut syrup notes.', price: 240, image_url: imgColdCoffee, is_veg: 1, sort_order: 4 });
  insertItem.run({ cafe_id: c1, category_id: catFrappes.lastInsertRowid, name: 'Berry Strawberry Mocha', description: 'Unique blend of fresh strawberry and chocolate mocha.', price: 240, image_url: imgColdCoffee, is_veg: 1, sort_order: 5 });

  // Sip & Savor (3 items)
  insertItem.run({ cafe_id: c1, category_id: catSipSavor.lastInsertRowid, name: 'Red Bull', description: 'Cold energy booster for when you need that extra kick.', price: 140, image_url: imgLemonade, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c1, category_id: catSipSavor.lastInsertRowid, name: 'Ginger Ale', description: 'Bubbly carbonated ginger refreshment, served chilled.', price: 140, image_url: imgLemonade, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c1, category_id: catSipSavor.lastInsertRowid, name: 'Tonic Water', description: 'Classic carbonated mixer. Pure and refreshing.', price: 140, image_url: imgLemonade, is_veg: 1, sort_order: 3 });

  // ── Cafe 2: Brew House Items (Keep basic) ──
  const idEspresso2 = insertItem.run({ cafe_id: c2, category_id: catCoffee2.lastInsertRowid, name: 'Espresso', description: 'Bold, pure double shot. Straight to the point.', price: 60, image_url: imgChai, is_veg: 1, sort_order: 1 });
  insertItem.run({ cafe_id: c2, category_id: catCoffee2.lastInsertRowid, name: 'Cappuccino', description: 'Espresso with rich, hot steamed milk foam.', price: 110, image_url: imgChai, is_veg: 1, sort_order: 2 });
  insertItem.run({ cafe_id: c2, category_id: catCoffee2.lastInsertRowid, name: 'Cold Brew', description: 'Slow-steeped 12 hours for a super smooth buzz.', price: 130, image_url: imgColdCoffee, is_veg: 1, sort_order: 3 });
  insertItem.run({ cafe_id: c2, category_id: catSnacks2.lastInsertRowid,    name: 'Croissant', description: 'Buttery, flaky, baked fresh in our oven.', price: 90, image_url: imgSamosa, is_veg: 1, sort_order: 1 });


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
