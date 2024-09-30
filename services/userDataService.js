const jwt = require('jsonwebtoken');
const createConnectionPool = require('../utils/dbConnection');
const pool = createConnectionPool();
const secretKey = process.env.JWT_SECRET; // 비밀 키

// JWT 토큰 검증
const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded.username);
    });
  });
};

// 사용자 정보 및 전적 조회 로직
const getUserData = async (userNickname, userTable, recordTable) => {
  const connection = await pool.getConnection();
  try {
    // 사용자 정보 쿼리
    const userQuery = `SELECT * FROM ${userTable} WHERE Nickname = ?`;
    const userResult = await connection.query(userQuery, [userNickname]);

    if (userResult.length === 0) {
      return null;
    }

    // 사용자 전적 쿼리
    const recordQuery = `
      SELECT
        COUNT(*) AS countwin,
        (SELECT COUNT(*) FROM ${recordTable} WHERE Loser = ? OR lose2 = ? OR lose3 = ? OR lose4 = ?) AS countlose
      FROM ${recordTable}
      WHERE Winner = ? OR win2 = ? OR win3 = ? OR win4 = ?
    `;
    const recordResult = await connection.query(recordQuery, [
      userNickname, userNickname, userNickname, userNickname,
      userNickname, userNickname, userNickname, userNickname
    ]);

    // 사용자 정보 및 전적 데이터 반환
    return {
      nickname: userNickname,
      email: userResult[0].email,
      tscore: (userResult[0].BScore + userResult[0].LScore).toString(),
      bscore: userResult[0].BScore.toString(),
      lscore: userResult[0].LScore.toString(),
      lastdate: new Date(userResult[0].Lastgame).toLocaleDateString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      }),
      weapon: userResult[0].Class,
      countwin: recordResult[0].countwin.toString(),
      countlose: recordResult[0].countlose.toString(),
      countrecord: (recordResult[0].countwin + recordResult[0].countlose).toString(),
    };
  } catch (error) {
    console.error('사용자 정보 및 전적 조회 오류:', error);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  verifyToken,
  getUserData,
};
