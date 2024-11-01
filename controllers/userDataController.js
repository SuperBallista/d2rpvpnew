const createConnectionPool = require('../utils/dbConnection');
const pool = createConnectionPool();  // MariaDB 풀 생성
const { DateTime } = require('luxon');

const userDataService = require('../services/userDataService');
const recordService = require('../services/recordService');


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



// 도전 경기를 취소하는 엔드포인트
const cancelChallenge = async (req, res) => {

  const tableName = req.body.mode ? "m" : "b";
  try {


    const connection = await pool.getConnection();

    const RemoveChallengaQuery = `UPDATE ${tableName}_user SET Challenge = NULL, ChallengeDate = NULL WHERE Nickname = ?`
    await connection.query(RemoveChallengaQuery, [req.user.username]);
    connection.release();

    res.status(200).json({ message: '취소가 완료되었습니다!' });
    console.log("도전 취소 완료", req.user.username, "가 도전을 취소하였습니다");
  } catch (error) {
    console.error('Error approving and moving record in database:', error);
    res.status(500).json({ error: 'Internal Server Error' });

  }

}


const checkChallenge = async (req, res) => {
  const tableName = req.body.mode ? "m" : "b";
  const GameWinner = req.user.username;
  const GameLoser = req.body.challenge;

  try {
    const connection = await pool.getConnection();
    const checkDateQuery = `SELECT ChallengeDate FROM ${tableName}_user WHERE Nickname = ?`;

    // query 결과에서 rows만 가져오기
    const [rows] = await connection.query(checkDateQuery, [GameWinner]);
    const checkDateResult = rows;

    // 데이터가 없는 경우 확인
    if (!checkDateResult || !checkDateResult.ChallengeDate) {
      return res.status(400).json({ error: "도전 기록이 없거나 유효한 날짜가 아닙니다." });
    }

    // ChallengeDate를 Luxon DateTime 형식으로 변환 (fromJSDate 사용)
    const challengeDate = DateTime.fromJSDate(checkDateResult.ChallengeDate).setZone('Asia/Seoul');
    const today = DateTime.now().setZone('Asia/Seoul');
    const diffInDays = today.diff(challengeDate, 'days').days;

    console.log("Challenge Date:", challengeDate.toISO());
    console.log("Today:", today.toISO());
    console.log("Difference in days:", diffInDays);

    if (diffInDays <= 7) {
      return res.status(400).json({ error: "아직 기간이 남았습니다" });
    }

    if (!GameLoser) {
      return res.status(400).json({ error: "도전 중인 상대가 없습니다" });
    }

    connection.release();

    const result = await recordService.challengelose(tableName, GameWinner, GameLoser);
    res.status(200).json({ message: '기록이 완료되었습니다!' });
    console.log("도전 경기 기권 결과", GameWinner, "의 승리", GameLoser, "의 패배");

  } catch (error) {
    console.error('Error approving and moving record in database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


  module.exports = {
  getUserData,
  getUserDataM,
  cancelChallenge,
  checkChallenge,
};
