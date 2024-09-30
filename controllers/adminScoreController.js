const adminScoreService = require('../services/adminScoreService');
const { startscore, startscore_b } = require('../utils/scoreUtils');  // startscore 임포트

// b_user 점수 부여
const submitAdminScore = async (req, res) => {
  try {
    const { player, playerScore } = req.body;
    const userNickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용

    if (userNickname !== 'admin') {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    await adminScoreService.updateUserScore('b_user', player, playerScore);
    console.log(`관리자의 점수 직접 부여: ${player}에게 ${playerScore}점 부여`);

    res.status(200).json({ message: 'Lscore update successfully' });
  } catch (error) {
    console.error('Error updating record in database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// m_user 점수 부여
const submitAdminScoreM = async (req, res) => {
  try {
    const { player, playerScore } = req.body;
    const userNickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용

    if (userNickname !== 'admin_m') {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    await adminScoreService.updateUserScore('m_user', player + '_m', playerScore);
    console.log(`관리자의 점수 직접 부여: ${player}_m 에게 ${playerScore}점 부여`);

    res.status(200).json({ message: 'Lscore update successfully' });
  } catch (error) {
    console.error('Error updating record in database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// b_user 랭킹 리셋
const resetRank = async (req, res) => {
  try {
    const userNickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용

    if (userNickname !== 'admin') {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    await adminScoreService.resetRank('b_user', 'b_record', 'b_temp', 'b_eventrecord', 'b_oldrecord', 'b_oldhistory', 'b_oldtournament', startscore);
    res.json({ success: true });
    console.log('b_user 계정 데이터를 초기화하였습니다');
  } catch (error) {
    console.error('랭킹 초기화 실패', error);
    res.status(500).json({ error: '랭킹 초기화 실패' });
  }
};

// m_user 랭킹 리셋
const resetRankM = async (req, res) => {
  try {
    const userNickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용

    if (userNickname !== 'admin_m') {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    await adminScoreService.resetRank('m_user', 'm_record', 'm_temp', 'm_eventrecord', 'm_oldrecord', 'm_oldhistory', 'm_oldtournament', startscore_b);
    res.json({ success: true });
    console.log('m_user 계정 데이터를 초기화하였습니다');
  } catch (error) {
    console.error('랭킹 초기화 실패', error);
    res.status(500).json({ error: '랭킹 초기화 실패' });
  }
};

module.exports = {
  submitAdminScore,
  submitAdminScoreM,
  resetRank,
  resetRankM,
};
