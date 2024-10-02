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

// 사용자 점수 업데이트
const updateUserScore = async (tableName, player, adminScore) => {
  const connection = await pool.getConnection();
  try {
    const updateScoreQuery = `
      UPDATE ${tableName}
      SET LScore = LScore + ?
      WHERE Nickname = ?;
    `;
    await connection.query(updateScoreQuery, [adminScore, player]);
  } catch (error) {
    console.error('Error updating user score:', error);
    throw error;
  } finally {
    connection.release();
  }
};

 
  // 랭킹 리셋 및 데이터 백업 로직
  const resetRank = async (userTable, recordTable, tempTable, eventRecordTable, oldRecordTable, oldHistoryTable, oldTournamentTable, score) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
  
    try {
      // 사용자 데이터 백업
      const backupUserQuery = `
        INSERT INTO ${oldRecordTable} (Nickname, BScore, LScore, Class, Month)
        SELECT Nickname, BScore, LScore, Class, DATE_FORMAT(NOW(), '%Y-%m-01')
        FROM ${userTable};
      `;
      await connection.query(backupUserQuery);
  
      // 기록 데이터 백업
      const backupHistoryQuery = `
        INSERT INTO ${oldHistoryTable} (Date, Winner, Loser, Win2, Win3, Win4, Lose2, Lose3, Lose4, WScore, LScore)
        SELECT Date, Winner, Loser, Win2, Win3, Win4, Lose2, Lose3, Lose4, WScore, LScore
        FROM ${recordTable};
      `;
      await connection.query(backupHistoryQuery);
  
      // 대회 기록 백업
      const backupTournamentQuery = `
        INSERT INTO ${oldTournamentTable} (eventname, Championship, Runner_up, Place3rd, numberteams)
        SELECT eventname, Championship1, Runner_up1, Place3rd1, numberteams
        FROM ${eventRecordTable}
        WHERE teamSize = 1 AND accept = 2;
      `;
      await connection.query(backupTournamentQuery);
  
      // 사용자 점수 초기화
      const resetScoreQuery = `
        UPDATE ${userTable}
        SET BScore = ?, LScore = 0, Records = 0;
      `;
      const resetScoreQueryM = `
      UPDATE ${userTable}
      SET BScore = ?, LScore = 0;
    `;


      if (userTable === 'b_user') {
      await connection.query(resetScoreQuery, [score]);
    }
    else {
      await connection.query(resetScoreQueryM, [score]);

    }


    if (userTable === 'm_user')
    {await connection.query(`UPDATE m_clan SET Score = 0`)
    await connection.query(`DELETE FROM m_clanrecord`)
    await connection.query(`DELETE FROM m_clanrecordtemp`)

    }





      // 기록 및 임시 테이블 초기화
      const deleteRecordQuery = `DELETE FROM ${recordTable};`;
      await connection.query(deleteRecordQuery);
  
      const deleteTempQuery = `DELETE FROM ${tempTable};`;
      await connection.query(deleteTempQuery);
  
      const deleteEventRecordQuery = `DELETE FROM ${eventRecordTable};`;
      await connection.query(deleteEventRecordQuery);
  
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('랭킹 리셋 실패:', error);
      throw error;
    } finally {
      connection.release();
    }
  };
  

module.exports = {
  verifyToken,
  updateUserScore,
  resetRank,
};
