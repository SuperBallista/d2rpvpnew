const bcrypt = require('bcrypt');
const createConnectionPool = require('../utils/dbConnection');
const pool = createConnectionPool();

// 계정 삭제 로직
const deleteAccount = async (userNickname, nowpw, tableName) => {
  const connection = await pool.getConnection();
  try {
    // 현재 비밀번호 확인
    const query = `SELECT pw FROM ${tableName} WHERE Nickname = ?`;
    const result = await connection.query(query, [userNickname]);

    if (result.length === 0) {
      return { success: false, status: 404, error: '사용자를 찾을 수 없습니다.' };
    }

    const currentPasswordHash = result[0].pw;
    const passwordMatch = await bcrypt.compare(nowpw, currentPasswordHash);

    if (!passwordMatch) {
      return { success: false, status: 401, error: '현재 암호가 일치하지 않습니다.' };
    }

    // 계정 삭제
    const deleteQuery = `DELETE FROM ${tableName} WHERE Nickname = ?`;
    const deleteResult = await connection.query(deleteQuery, [userNickname]);

    if (deleteResult.affectedRows === 1) {
      return { success: true };
    } else {
      return { success: false, status: 500, error: '계정 삭제에 실패했습니다.' };
    }
  } catch (error) {
    console.error('계정 삭제 오류:', error);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  deleteAccount,
};
