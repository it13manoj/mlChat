const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./chat.db');

// Create users table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    contact INT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    is_active INTEGER DEFAULT 0
)
`);

module.exports = db;
