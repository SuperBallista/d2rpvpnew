const mariadb = require('mariadb');

// MariaDB 연결 풀 생성 함수
function createConnectionPool() {
  return mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
   });
}

// 다른 파일에서 사용할 수 있도록 내보냄
module.exports = createConnectionPool;
