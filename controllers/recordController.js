const createConnectionPool = require('../utils/dbConnection');
const moment = require('moment');
const pool = createConnectionPool();  // MariaDB 풀 생성
const recordService = require('../services/recordService');

// 도전 기권하여 자동 패배 기록 엔드포인트(도전자 승리시)

const challengelose = async (req, res) => {

  const tableName = req.body.mode ? "m" : "b";
  const GameLoser = req.user.username; // 응전자의 패배
  const GameWinner = req.body.challenger; // 도전자의 승리

  try {

    const result = await recordService.challengelose(tableName, GameWinner, GameLoser);

    res.status(200).json({ message: '기록이 완료되었습니다!' });
    console.log("도전 경기 기권 결과",GameWinner, "의 승리", GameLoser, "의 패배")
  } catch (error) {
    console.error('Error approving and moving record in database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

}


// 도전 경기 응답하여 기록하기 엔드포인트
const challengewin = async (req, res) => {

  const tableName = req.body.mode ? "m" : "b";

  try {
    const connection = await pool.getConnection();
    const RemoveChallengaQuery = `UPDATE ${tableName}_user SET Challenge = NULL, ChallengeDate = NULL WHERE Nickname = ?`
    await connection.query(RemoveChallengaQuery, [req.body.challenger]);

    res.status(200).json({ message: '기록이 완료되었습니다!' });
    console.log("도전 승인 완료", req.body.challenger, req.user.username, "경기 결과를 기록해야 합니다");
    connection.release(); // 연결 반환

  } catch (error) {
    console.error('Error approving and moving record in database:', error);
    res.status(500).json({ error: 'Internal Server Error' });

  }

}



// 기록 제출 엔드포인트
const submitRecord = async (req, res) => {

const tableName = req.body.mode ? "m_temp" : "b_temp";
  
  try {
    if (!req.body.winner) {
  return res.status(400).json({ error: 'Invalid Data' });
}

    const userNickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용

    const currentDate = moment().utcOffset('+0900').format('YYYY-MM-DD HH:mm:ss');
    const values = recordService.createRecordValues(req.body.winner, currentDate, userNickname);

    const query = `
      INSERT INTO ${tableName} (Date, Winner, Loser, Checked)
      VALUES (?, ?, ?, ?);
    `;

    const connection = await pool.getConnection();
    await connection.query(query, values);
    connection.release();

    console.log(values + ' babapk 대전기록 등록');
    res.status(200).json({ message: 'Send Data to Server Success' });
  } catch (error) {
    console.error('Error adding record:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// 기록 승인 처리
const approveRecord = async (req, res) => {
  const orderNum = req.body.orderNum;
  const modedata = req.body.mode;
  console.log(req.body.mode)


  if (!orderNum || modedata === undefined) {
    return res.status(400).json({ error: 'Invalid Data' });
  }

  try {
    const result = await recordService.approveRecord(orderNum, modedata);
    res.status(200).json({ message: 'Record approved and moved to b_record successfully' });
    console.log(orderNum,'미승인 랭킹전 기록 승인');
  } catch (error) {
    console.error('Error approving and moving record in database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 미승인 기록 삭제
const deleteRecord = async (req, res) => {
  const orderNum = req.body.orderNum;
  const mode = req.body.mode;

  if (!orderNum) {
    return res.status(400).json({ error: 'Invalid OrderNum' });
  }

  try {
    console.log(orderNum,"미승인 랭킹전 기록 삭제")
    const result = await recordService.deleteRecord(orderNum, mode);
    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 레코드 데이터 가져오기
const getRecordData = async (req, res) => {
  try {
    const records = await recordService.fetchRecordData(false);
    res.json(records);
  } catch (error) {
    console.error('기록 불러오기 실패:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};

// 레코드 데이터 가져오기
const getRecordDataM = async (req, res) => {
  try {
    const records = await recordService.fetchRecordData(true);
    res.json(records);
  } catch (error) {
    console.error('기록 불러오기 실패:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};



// 승인 대기중인 기록 불러오기
const getPendingRecords = async (req, res) => {
  try {
    const userNickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용

    const data = await recordService.fetchPendingRecords(userNickname, false);
    res.json(data);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Internal Server Error');
  }
};

const getPendingRecords_m = async (req, res) => {
  try {
    const userNickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용

    const data = await recordService.fetchPendingRecords(userNickname, true);
    res.json(data);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Internal Server Error');
  }
};



module.exports = {
  submitRecord,
  approveRecord,
  deleteRecord,
  getRecordData,
  getRecordDataM,
  getPendingRecords,
  getPendingRecords_m,
  challengelose,
  challengewin
};
