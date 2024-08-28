// db.js
const Database = require('better-sqlite3');

// 데이터베이스 연결 생성 (없으면 자동으로 생성됨)
const db = new Database('database.sqlite');

// 리프레시 토큰 테이블 생성
db.prepare(`
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
    username TEXT NOT NULL,
    expires_at DATETIME NOT NULL
  )
`).run();

module.exports = db;
