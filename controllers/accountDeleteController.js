const accountDeleteService = require('../services/accountDeleteService');

// b_user 계정 삭제
const deleteAccount = async (req, res) => {
  try {
    const userNickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용
    const { nowpw } = req.body;

    const result = await accountDeleteService.deleteAccount(userNickname, nowpw, 'b_user');
    if (result.success) {
      // 계정 삭제 성공 시 쿠키 삭제
      res.clearCookie("d2rpvpjwtToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
      res.clearCookie("d2rpvprefreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
      console.log(req.user.username, "계정 삭제 성공")
      res.json({ success: true });
    } else {
      res.status(result.status).json({ error: result.error });
    }
  } catch (error) {
    console.error('계정 삭제 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};

// m_user 계정 삭제
const deleteAccountM = async (req, res) => {
  try {
    const userNickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용
    const { nowpw } = req.body;

    const result = await accountDeleteService.deleteAccount(userNickname, nowpw, 'm_user');
    if (result.success) {
      // 계정 삭제 성공 시 쿠키 삭제
      res.clearCookie("d2rpvpjwtToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
      res.clearCookie("d2rpvprefreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
      console.log(req.user.username, "계정 삭제 성공")
      res.json({ success: true });
    } else {
      res.status(result.status).json({ error: result.error });
    }
  } catch (error) {
    console.error('계정 삭제 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};

module.exports = {
  deleteAccount,
  deleteAccountM,
};
