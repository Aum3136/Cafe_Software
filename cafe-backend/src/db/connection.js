const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './data/cafe.db';

// Resolve relative paths from project root, not __dirname
const resolvedPath = path.resolve(process.cwd(), DB_PATH);

// Singleton — module cache means this runs once per process
const db = new Database(resolvedPath, {
  // WAL mode: faster reads, concurrent reads while writing, safer on Railway
  // This is the single most important SQLite performance setting
});

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');  // Enforce FK constraints — SQLite has these OFF by default
db.pragma('busy_timeout = 5000'); // Wait up to 5s if DB is locked, instead of crashing

module.exports = db;
