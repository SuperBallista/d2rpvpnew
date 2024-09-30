const passwordResetService = require('../services/passwordResetService');

// b_user 임시 비밀번호 요청
const processEmailPw = async (req, res) => {
  try {
    const { findpw_nickname, findpw_email } = req.body;

    const result = await passwordResetService.resetPassword(findpw_nickname, findpw_email, 'b_user');
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(result.status).json({ error: result.error });
    }
  } catch (error) {
    console.error('서버 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};

// m_user 임시 비밀번호 요청
const processEmailPwM = async (req, res) => {
  try {
    let { findpw_nickname, findpw_email } = req.body;
    findpw_nickname += '_m';

    const result = await passwordResetService.resetPassword(findpw_nickname, findpw_email, 'm_user');
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(result.status).json({ error: result.error });
    }
  } catch (error) {
    console.error('서버 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};

module.exports = {
  processEmailPw,
  processEmailPwM,
};
