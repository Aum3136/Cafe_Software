const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const slugify = require('slugify');
const db = require('../db/connection');

/*
  AUTH CONTROLLER
  ───────────────
  register → creates a new cafe + owner account
  login    → returns a JWT if credentials are valid

  JWT payload shape: { cafeId, email, slug }
  Token expiry: 30 days (long enough that owners aren't constantly re-logging in)
*/

const TOKEN_EXPIRY = '30d';

const generateToken = (cafe) => {
  return jwt.sign(
    { cafeId: cafe.id, email: cafe.email, slug: cafe.slug },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

// POST /api/auth/register
const register = (req, res, next) => {
  try {
    const { name, owner_name, email, password, phone, address } = req.body;

    if (!name || !owner_name || !email || !password) {
      return res.status(400).json({ error: 'name, owner_name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Generate a URL-safe slug from the cafe name, e.g. "Chai Corner" → "chai-corner"
    // If slug already exists, append a timestamp suffix to make it unique
    let slug = slugify(name, { lower: true, strict: true });
    const existing = db.prepare('SELECT id FROM cafes WHERE slug = ?').get(slug);
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const hashed = bcrypt.hashSync(password, 10);

    const stmt = db.prepare(`
      INSERT INTO cafes (name, slug, owner_name, email, password, phone, address)
      VALUES (@name, @slug, @owner_name, @email, @password, @phone, @address)
    `);
    const result = stmt.run({ name, slug, owner_name, email, password: hashed, phone, address });

    const cafe = db.prepare('SELECT id, name, slug, email FROM cafes WHERE id = ?')
                   .get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Cafe registered successfully.',
      token: generateToken(cafe),
      cafe: { id: cafe.id, name: cafe.name, slug: cafe.slug, email: cafe.email }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const cafe = db.prepare('SELECT * FROM cafes WHERE email = ?').get(email);

    // Use a generic message — don't reveal whether email or password was wrong
    if (!cafe || !bcrypt.compareSync(password, cafe.password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (!cafe.is_active) {
      return res.status(403).json({ error: 'This account has been suspended.' });
    }

    res.json({
      token: generateToken(cafe),
      cafe: { id: cafe.id, name: cafe.name, slug: cafe.slug, email: cafe.email }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me  (protected — requires token)
const me = (req, res) => {
  const cafe = db.prepare(
    'SELECT id, name, slug, owner_name, email, phone, address, logo_url, created_at FROM cafes WHERE id = ?'
  ).get(req.cafe.id);

  if (!cafe) return res.status(404).json({ error: 'Cafe not found.' });
  res.json({ cafe });
};

module.exports = { register, login, me };
