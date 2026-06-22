const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const slugify = require('slugify');
const crypto = require('crypto');
const db = require('../db/connection');
const sendEmail = require('../utils/sendEmail');

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

// Simple in-memory rate limiting map for login: email -> array of timestamps (ms)
const loginRateLimitMap = {};

const checkLoginRateLimit = (email) => {
  const now = Date.now();
  const fifteenMinutesAgo = now - 15 * 60 * 1000;

  if (!loginRateLimitMap[email]) {
    loginRateLimitMap[email] = [];
  }

  // Filter out timestamps older than 15 minutes
  loginRateLimitMap[email] = loginRateLimitMap[email].filter(timestamp => timestamp > fifteenMinutesAgo);

  if (loginRateLimitMap[email].length >= 5) {
    const oldestAttempt = loginRateLimitMap[email][0];
    const timeRemainingMs = (oldestAttempt + 15 * 60 * 1000) - now;
    const minutesRemaining = Math.ceil(timeRemainingMs / (60 * 1000));
    return {
      allowed: false,
      message: `Too many login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`
    };
  }

  return { allowed: true };
};

const recordFailedLoginAttempt = (email) => {
  const now = Date.now();
  if (!loginRateLimitMap[email]) {
    loginRateLimitMap[email] = [];
  }
  loginRateLimitMap[email].push(now);
};

const clearLoginAttempts = (email) => {
  delete loginRateLimitMap[email];
};

// POST /api/auth/login
const login = (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check login rate limit
    const rateLimitCheck = checkLoginRateLimit(trimmedEmail);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({ error: rateLimitCheck.message });
    }

    const cafe = db.prepare('SELECT * FROM cafes WHERE email = ?').get(trimmedEmail);

    // Use a generic message — don't reveal whether email or password was wrong
    if (!cafe || !bcrypt.compareSync(password, cafe.password)) {
      recordFailedLoginAttempt(trimmedEmail);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (!cafe.is_active) {
      return res.status(403).json({ error: 'This account has been suspended.' });
    }

    // Reset failed login attempts on success
    clearLoginAttempts(trimmedEmail);

    res.json({
      token: generateToken(cafe),
      cafe: { id: cafe.id, name: cafe.name, slug: cafe.slug, email: cafe.email }
    });
  } catch (err) {
    next(err);
  }
};

// Simple in-memory rate limiting map: email -> array of timestamps (ms)
const rateLimitMap = {};

const checkRateLimit = (email) => {
  const now = Date.now();
  const oneHourAgo = now - 3600 * 1000;
  
  if (!rateLimitMap[email]) {
    rateLimitMap[email] = [];
  }
  
  // Filter out timestamps older than 1 hour
  rateLimitMap[email] = rateLimitMap[email].filter(timestamp => timestamp > oneHourAgo);
  
  if (rateLimitMap[email].length >= 3) {
    return false; // rate limit exceeded
  }
  
  // Add current timestamp
  rateLimitMap[email].push(now);
  return true;
};

// Background memory cleanup for rate limiters (Garbage Collector) to prevent memory leaks
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

const cleanupRateLimitMaps = () => {
  const now = Date.now();
  const fifteenMinutesAgo = now - 15 * 60 * 1000;
  const oneHourAgo = now - 3600 * 1000;

  // Clean loginRateLimitMap
  for (const email in loginRateLimitMap) {
    loginRateLimitMap[email] = loginRateLimitMap[email].filter(timestamp => timestamp > fifteenMinutesAgo);
    if (loginRateLimitMap[email].length === 0) {
      delete loginRateLimitMap[email];
    }
  }

  // Clean rateLimitMap
  for (const email in rateLimitMap) {
    rateLimitMap[email] = rateLimitMap[email].filter(timestamp => timestamp > oneHourAgo);
    if (rateLimitMap[email].length === 0) {
      delete rateLimitMap[email];
    }
  }
};

// Start background task
const cleanupTimer = setInterval(cleanupRateLimitMaps, CLEANUP_INTERVAL);

// Unref the timer so it doesn't prevent Node.js from exiting in test/script runs
if (cleanupTimer && typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

// Export references on the login handler for testing and verification
login.loginRateLimitMap = loginRateLimitMap;
login.rateLimitMap = rateLimitMap;
login.cleanupRateLimitMaps = cleanupRateLimitMaps;

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check rate limit (max 3 requests per email per hour)
    if (!checkRateLimit(trimmedEmail)) {
      return res.status(429).json({ error: 'Too many password reset requests. Please try again in an hour.' });
    }

    // Lookup owner
    const cafe = db.prepare('SELECT id, name, email FROM cafes WHERE email = ?').get(trimmedEmail);

    if (cafe) {
      // Generate secure random token
      const rawToken = crypto.randomBytes(32).toString('hex');
      // Hash the token using sha256 before storing
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      // Expiration: 1 hour (3600 seconds)
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;

      // Save token hash and expiration
      db.prepare(`
        UPDATE cafes 
        SET reset_token = ?, reset_token_expires = ? 
        WHERE id = ?
      `).run(hashedToken, expiresAt, cafe.id);

      // Construct reset link using FRONTEND_URL or fallback
      const frontendUrl = process.env.FRONTEND_URL || (process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',')[0].trim() : 'http://localhost:5173');
      const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

      // Branded HTML email
      const htmlContent = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #EDE9E0; border-radius: 16px; background-color: #FFFFFF; color: #1C1917;">
          <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #EDE9E0;">
            <span style="font-size: 40px;">☕</span>
            <h2 style="color: #1C1917; margin: 8px 0 0 0; font-size: 22px; font-weight: 800;">Cafe Ordering System</h2>
            <p style="color: #5C5754; font-size: 13px; margin: 4px 0 0 0;">Owner Password Reset</p>
          </div>
          <div style="color: #1C1917; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            <p>Hello <strong>${cafe.name}</strong>,</p>
            <p>We received a request to reset the password for your cafe owner account. Click the button below to choose a new password:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" style="background-color: #3D4A3E; color: #FFFFFF; padding: 12px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(61, 74, 62, 0.1), 0 2px 4px -2px rgba(61, 74, 62, 0.1);">Reset Password</a>
            </div>
            <p style="color: #5C5754; font-size: 13px;">If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; font-size: 12px; background-color: #FAF7F2; padding: 12px; border-radius: 8px; border: 1px solid #EDE9E0; color: #3D4A3E; font-family: monospace;">${resetLink}</p>
            <p>This link is valid for <strong>1 hour</strong>. If you did not request this, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div style="text-align: center; border-top: 1px solid #EDE9E0; padding-top: 16px; font-size: 12px; color: #A8A39F;">
            <p>© 2026 Cafe Ordering System. All rights reserved.</p>
          </div>
        </div>
      `;

      // Send email asynchronously
      sendEmail({
        to: cafe.email,
        subject: 'Reset Your Cafe Owner Password',
        html: htmlContent
      }).catch(err => {
        console.error('Async email sending failed:', err);
      });
    }

    // Always return a generic success message
    return res.json({ message: 'If a cafe account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Hash the incoming raw token to look up the DB record
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the cafe by the reset_token hash
    const cafe = db.prepare('SELECT id, reset_token_expires FROM cafes WHERE reset_token = ?').get(hashedToken);

    if (!cafe) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
    }

    // Check if the token has expired
    const currentUnix = Math.floor(Date.now() / 1000);
    if (cafe.reset_token_expires < currentUnix) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
    }

    // Hash the new password
    const hashed = bcrypt.hashSync(newPassword, 10);

    // Update the password and clear the reset token fields
    db.prepare(`
      UPDATE cafes 
      SET password = ?, reset_token = NULL, reset_token_expires = NULL 
      WHERE id = ?
    `).run(hashed, cafe.id);

    return res.json({ message: 'Password has been reset successfully.' });
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

module.exports = { register, login, me, forgotPassword, resetPassword };
