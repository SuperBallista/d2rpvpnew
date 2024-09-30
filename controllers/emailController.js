const { processEmailChange } = require('../services/emailService');

// 공통 이메일 변경 로직
const processChangeEmail = async (req, res, userTable) => {
  try {
    console.log(`${req.user.username} 이메일 변경 요청 확인`);
    const { nowpw, newemail } = req.body;
    const result = await processEmailChange(req.user.username, nowpw, newemail, userTable);
    res.status(result.status).json(result);
  } catch (error) {
    console.error('이메일 변경 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};

module.exports = {
  processChangeEmail
};
