const createConnectionPool = require('../utils/dbConnection');
const rankService = require('../services/rankService');
const pool = createConnectionPool(); // MariaDB 풀 생성

// b_user 랭킹 데이터 처리 함수
const getRankData = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // b_user 테이블에서 데이터 가져오기
    const rankdb = await connection.query(`
      SELECT Nickname, BScore, LScore, RScore, Class, Lastgame, Records 
      FROM b_user 
      WHERE Nickname != "admin" 
    `, [rankService.RecordScore]);

    const [recordWin, recordLose] = await Promise.all([
      connection.query(rankService.getWinCountQuery('b_record', 'b_user')),
      connection.query(rankService.getLoseCountQuery('b_record', 'b_user'))
    ]);

    const result = rankService.createResultArray(rankdb, recordWin, recordLose, false);
    connection.release();

    res.json(result);
  } catch (error) {
    console.error('데이터베이스 오류:', error);
    res.status(500).json({ error: 'DB Error' });
  }
};

// m_user 랭킹 데이터 처리 함수
const getRankDataM = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // m_user 테이블에서 데이터 가져오기
    const rankdb = await connection.query(`
      SELECT Nickname, BScore, LScore, Class, Lastgame 
      FROM m_user 
      WHERE Nickname != "admin_m" 
      ORDER BY (BScore + LScore) DESC
    `);

    const result = rankService.createResultArray(rankdb, 0, 0, true);
    connection.release();

    res.json(result);
  } catch (error) {
    console.error('데이터베이스 오류:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getRankData,
  getRankDataM
};
