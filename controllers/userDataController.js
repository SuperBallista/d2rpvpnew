const userDataService = require('../services/userDataService');

// b_user 사용자 정보 가져오기
const getUserData = async (req, res) => {
  try {
    const userNickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용

    const userData = await userDataService.getUserData(userNickname, 'b_user');
    if (!userData) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    res.json(userData);
  } catch (error) {
    console.error('사용자 정보 가져오기 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};

// m_user 사용자 정보 가져오기
const getUserDataM = async (req, res) => {
  try {
    const userNickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용

    const userData = await userDataService.getUserData(userNickname, 'm_user');
    if (!userData) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    res.json(userData);
  } catch (error) {
    console.error('사용자 정보 가져오기 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};

module.exports = {
  getUserData,
  getUserDataM,
};
