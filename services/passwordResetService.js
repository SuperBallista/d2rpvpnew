const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const createConnectionPool = require('../utils/dbConnection');
const pool = createConnectionPool();

// 임시 비밀번호 생성 함수
const generateRandomPassword = (length) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

// 이메일 전송 함수
const sendEmail = async (email, password) => {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: 'D2R PvP 임시 암호',
    text: `임시 암호: ${password}`,
  };

  const transporter = nodemailer.createTransport({
    host: 'smtp.naver.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PW,
    },
  });

  return transporter.sendMail(mailOptions);
};

// 비밀번호 재설정 로직
const resetPassword = async (nickname, email, tableName) => {
  const connection = await pool.getConnection();
  try {
    // 사용자 이메일 조회
    const query = `SELECT email FROM ${tableName} WHERE Nickname = ?`;
    const result = await connection.query(query, [nickname]);

    if (result.length === 0) {
      return { success: false, status: 404, error: '사용자를 찾을 수 없습니다.' };
    }

    const correctEmail = result[0].email;

    if (correctEmail !== email) {
      return { success: false, status: 401, error: '이메일이 일치하지 않습니다.' };
    }

    // 임시 비밀번호 생성
    const temporaryPassword = generateRandomPassword(10);
    const temporaryPasswordHash = await bcrypt.hash(temporaryPassword, 10);

    // 비밀번호 업데이트
    const updateQuery = `UPDATE ${tableName} SET pw = ? WHERE Nickname = ?`;
    const updateResult = await connection.query(updateQuery, [temporaryPasswordHash, nickname]);

    if (updateResult.affectedRows === 1) {
      // 이메일 전송
      await sendEmail(email, temporaryPassword);
      return { success: true };
    } else {
      return { success: false, status: 500, error: '암호 업데이트에 실패했습니다.' };
    }
  } catch (error) {
    console.error('비밀번호 재설정 오류:', error);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  resetPassword,
};
