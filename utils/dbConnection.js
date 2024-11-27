const mariadb = require('mariadb');

let pool; // 전역 Pool 변수

function createConnectionPool() {
  if (!pool) {
    // Pool이 없으면 생성
    pool = mariadb.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      port: process.env.DB_PORT,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectionLimit: 5, // 동시 연결 수 제한
      idleTimeout: 10000, // 10초 비활성화 상태 후 종료
          });
  }
  return pool;
}

module.exports = createConnectionPool;
