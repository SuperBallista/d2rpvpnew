const createConnectionPool = require('../utils/dbConnection');
const pool = createConnectionPool();  // MariaDB 풀 생성

// b_user 테이블에서 Nickname 가져오기
const getNicknames = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const rows = await connection.query('SELECT Nickname FROM b_user WHERE Nickname != "admin"');
    connection.release();

    // Nickname 목록만 추출하여 응답
    const nicknames = rows.map((row) => row.Nickname);
    res.json(nicknames);
  } catch (error) {
    console.error('데이터베이스 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};

// m_user 테이블에서 Nickname 가져오기
const getNicknamesM = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const rows = await connection.query('SELECT Nickname FROM m_user WHERE Nickname != "admin_m"');
    connection.release();

    // Nickname 목록만 추출하여 응답
    const nicknames = rows.map((row) => row.Nickname);
    res.json(nicknames);
  } catch (error) {
    console.error('데이터베이스 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};

module.exports = {
  getNicknames,
  getNicknamesM,
};
