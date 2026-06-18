require('dotenv').config();
require('./db/schema'); // Initialize DB tables on startup

const express = require('express');
const cors = require('cors');

const authRoutes       = require('./routes/auth');
const itemRoutes       = require('./routes/items');
const categoryRoutes   = require('./routes/categories');
const orderRoutes      = require('./routes/orders');
const menuRoutes       = require('./routes/menu');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────
// In production, only allow requests from your Vercel frontend.
// In development, allow localhost:5173 (Vite default port).
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));

// ── BODY PARSING ──────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── HEALTH CHECK ──────────────────────────────────────────────────────────
// UptimeRobot will ping this every 5 min to prevent Railway cold starts
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── ROUTES ────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/items',       itemRoutes);
app.use('/api/categories',  categoryRoutes);
app.use('/api/orders',      orderRoutes);
app.use('/api/menu',        menuRoutes);

// ── 404 HANDLER ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────
// Must be last — after all routes and other middleware
app.use(errorHandler);

// ── START SERVER ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
