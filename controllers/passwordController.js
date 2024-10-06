const passwordService = require('../services/passwordService');

// b_user 암호 변경
const changePassword = async (req, res) => {
  try {
    const { nowpw, newpw } = req.body;
    const userNickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용

    const result = await passwordService.changePassword(userNickname, nowpw, newpw, 'b_user');
    if (result.success) {
      console.log(userNickname,"암호 변경 성공")
      res.json({ success: true });
    } else {
      res.status(result.status).json({ error: result.error });
    }
  } catch (error) {
    console.error('암호 변경 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};

// m_user 암호 변경
const changePasswordM = async (req, res) => {
  try {
    const { nowpw, newpw } = req.body;
    const userNickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용

    const result = await passwordService.changePassword(userNickname, nowpw, newpw, 'm_user');
    if (result.success) {
      console.log(userNickname,"암호 변경 성공")
      res.json({ success: true });
    } else {
      res.status(result.status).json({ error: result.error });
    }
  } catch (error) {
    console.error('암호 변경 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};

module.exports = {
  changePassword,
  changePasswordM,
};
