const createConnectionPool = require('../utils/dbConnection');
const moment = require('moment');
const pool = createConnectionPool();  // MariaDB 풀 생성
const recordService = require('../services/recordService');

// b_user 기록 제출 엔드포인트
const submitRecord = async (req, res) => {
  try {
    const Loserpoint = parseInt(req.body.myScore);
    if (Loserpoint < 0 || Loserpoint >= req.body.winnerScore) {
      throw new Error('패자의 점수가 올바르지 않습니다');
    }

    const userNickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용

    const currentDate = moment().utcOffset('+0900').format('YYYY-MM-DD HH:mm:ss');
    const values = recordService.createRecordValues(req.body, currentDate, userNickname);

    const query = `
      INSERT INTO b_temp (Date, Winner, Loser, Win2, Win3, Win4, Lose2, Lose3, Lose4, WScore, LScore, Checked)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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

// b_user 기록 승인 처리
const approveRecord = async (req, res) => {
  const orderNum = req.body.orderNum;

  if (!orderNum) {
    return res.status(400).json({ error: 'Invalid OrderNum' });
  }

  try {
    const result = await recordService.approveRecord(orderNum);
    res.status(200).json({ message: 'Record approved and moved to b_record successfully' });
    console.log('Record approved and moved to b_record successfully');
  } catch (error) {
    console.error('Error approving and moving record in database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// b_user 미승인 기록 삭제
const deleteRecord = async (req, res) => {
  const orderNum = req.body.orderNum;

  if (!orderNum) {
    return res.status(400).json({ error: 'Invalid OrderNum' });
  }

  try {
    const result = await recordService.deleteRecord(orderNum);
    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// b_user 레코드 데이터 가져오기
const getRecordData = async (req, res) => {
  try {
    const records = await recordService.fetchRecordData();
    res.json(records);
  } catch (error) {
    console.error('기록 불러오기 실패:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};

// 승인 대기중인 기록 불러오기 (b_user)
const getPendingRecords = async (req, res) => {
  try {
    const userNickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용

    const data = await recordService.fetchPendingRecords(userNickname);
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
  getPendingRecords
};
