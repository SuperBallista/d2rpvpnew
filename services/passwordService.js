const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const createConnectionPool = require('../utils/dbConnection');
const pool = createConnectionPool();
const secretKey = process.env.JWT_SECRET;  // 환경 변수에서 비밀 키 가져오기

// JWT 토큰 검증
const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded.username);
    });
  });
};

// 암호 변경 처리 로직
const changePassword = async (userNickname, nowpw, newpw, tableName) => {
  const connection = await pool.getConnection();
  try {
    // 사용자의 현재 암호 확인
    const query = `SELECT pw FROM ${tableName} WHERE Nickname = ?`;
    const result = await connection.query(query, [userNickname]);

    if (result.length === 0) {
      return { success: false, status: 404, error: '사용자를 찾을 수 없습니다.' };
    }

    const currentPasswordHash = result[0].pw;

    // 현재 암호 검증
    const passwordMatch = await bcrypt.compare(nowpw, currentPasswordHash);
    if (!passwordMatch) {
      return { success: false, status: 401, error: '현재 암호가 일치하지 않습니다.' };
    }

    // 새로운 암호 해시 생성
    const newPasswordHash = await bcrypt.hash(newpw, 10);

    // 새로운 암호로 업데이트
    const updateQuery = `UPDATE ${tableName} SET pw = ? WHERE Nickname = ?`;
    const updateResult = await connection.query(updateQuery, [newPasswordHash, userNickname]);

    if (updateResult.affectedRows === 1) {
      return { success: true };
    } else {
      return { success: false, status: 500, error: '암호 업데이트에 실패했습니다.' };
    }
  } catch (error) {
    console.error('암호 변경 오류:', error);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  verifyToken,
  changePassword,
};
