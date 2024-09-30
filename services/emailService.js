const bcrypt = require('bcrypt');
const createConnectionPool = require('../utils/dbConnection');
const pool = createConnectionPool();

// 이메일 변경 서비스 함수
const processEmailChange = async (userNickname, nowpw, newemail, userTable) => {
  const connection = await pool.getConnection();

  try {
    // 사용자의 현재 암호 확인
    const result = await connection.query(`SELECT pw FROM ${userTable} WHERE Nickname = ?`, [userNickname]);

    if (result.length === 0) {
      return { status: 404, error: '사용자를 찾을 수 없습니다.' };
    }

    const currentPasswordHash = result[0].pw;

    // 현재 암호 검증
    const passwordMatch = await bcrypt.compare(nowpw, currentPasswordHash);

    if (!passwordMatch) {
      return { status: 401, error: '현재 암호가 일치하지 않습니다.' };
    }

    // 새로운 이메일로 업데이트
    const updateResult = await connection.query(`UPDATE ${userTable} SET email = ? WHERE Nickname = ?`, [newemail, userNickname]);

    if (updateResult.affectedRows === 1) {
      return { status: 200, success: true };
    } else {
      return { status: 500, error: '이메일 업데이트에 실패했습니다.' };
    }
  } catch (error) {
    console.error('이메일 변경 오류:', error);
    return { status: 500, error: '서버 오류' };
  } finally {
    connection.release();
  }
};

module.exports = {
  processEmailChange
};
