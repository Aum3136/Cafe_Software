const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './data/cafe.db';

// Resolve relative paths from project root instead of process.cwd()
const resolvedPath = path.isAbsolute(DB_PATH)
  ? DB_PATH
  : path.resolve(__dirname, '../../', DB_PATH);

// Auto-create directory if it doesn't exist — wrap in try-catch to prevent EROFS errors on Railway build-time
try {
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
} catch (err) {
  console.warn('Warning: Could not create database directory:', err.message);
}

// Singleton — module cache means this runs once per process
const db = new Database(resolvedPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

module.exports = db;