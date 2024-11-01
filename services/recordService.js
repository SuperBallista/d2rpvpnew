const moment = require('moment');


// 기록 데이터를 배열로 생성
const createRecordValues = (body, currentDate, userNickname) => {
  return [
    currentDate,
    body,
    userNickname,
    0, // Checked
  ];
};



const createConnectionPool = require('../utils/dbConnection');
const pool = createConnectionPool();

const { updateUserBScore, getBScore, updateUserBScoreM, getBScoreM, kvalue, evalue } = require('../utils/bScoreUtils');  // BScore 관련 유틸리티

const approveRecord = async (orderNum, modedata) => {

  const tableName = modedata ? "m" : "b";
  const max = modedata ? "20" : "15";

  const connection = await pool.getConnection();
  try {
    // 트랜잭션 시작
    await connection.beginTransaction();

    // b_temp 테이블에서 Checked 값을 2로 업데이트
    const updateCheckedQuery = `UPDATE ${tableName}_temp SET Checked = 2 WHERE OrderNum = ?;`;
    await connection.query(updateCheckedQuery, [orderNum]);

    // b_temp 테이블에서 데이터를 가져옴
    const selectQuery = `SELECT * FROM ${tableName}_temp WHERE OrderNum = ?;`;
    const selectedData = await connection.query(selectQuery, [orderNum]);
    const recordData = selectedData[0];

    // b_record 테이블에 데이터 삽입
    const insertQuery = `
      INSERT INTO ${tableName}_record (Date, Winner, Loser, WScore, LScore)
      VALUES (?, ?, ?, ?, ?);
    `;
    await connection.query(insertQuery, [
      recordData.Date, recordData.Winner, recordData.Loser, recordData.WScore, recordData.LScore,
    ]);
    const no_game_score_Query = `
    UPDATE ${tableName}_user
    SET Records = (IF(Records = ${max}, ${max}, Records + 1 ))
    Where Nickname = ?
    `
    

    // 점수 계산 및 업데이트

    await updateUserScores(connection, recordData, modedata);
    await connection.query(no_game_score_Query, recordData.Winner);
    await connection.query(no_game_score_Query, recordData.Loser);
  
  
  


    // 트랜잭션 커밋
    await connection.commit();
  } catch (error) {
    // 트랜잭션 롤백
    await connection.rollback();
    console.error('Error approving and moving record in database:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// 사용자 점수 업데이트 로직
const updateUserScores = async (connection, recordData, modedata) => {
const tableName = modedata ? "m" : "b";
let winnerBScore
let loserBScore
  if (modedata) {
  winnerBScore = Number(await getBScoreM(connection, recordData.Winner));
  loserBScore = Number(await getBScoreM(connection, recordData.Loser));
}
else {
  winnerBScore = Number(await getBScore(connection, recordData.Winner));
  loserBScore = Number(await getBScore(connection, recordData.Loser));
}

  const addScore = kvalue * (1 - (1 / (1 + 10 ** ((loserBScore - winnerBScore) / evalue))));
  const subtractScore = addScore;

  const changedscorerecord = `
  UPDATE ${tableName}_record AS t1
  JOIN (
      SELECT MAX(OrderNum) AS max_order
      FROM ${tableName}_record
  ) AS t2 ON t1.OrderNum = t2.max_order
  SET t1.AddScore = ?;
  `;
          
    await connection.query(changedscorerecord, [addScore]);
  


  // 점수 업데이트
if (modedata) {

  await updateUserBScoreM(connection, winnerBScore + addScore, recordData.Winner);
  await updateUserBScoreM(connection, loserBScore - subtractScore, recordData.Loser);
} else {
  await updateUserBScore(connection, winnerBScore + addScore, recordData.Winner);
  await updateUserBScore(connection, loserBScore - subtractScore, recordData.Loser);

}

  console.log(`Score updates completed`);
};


// 기록 삭제 로직
const deleteRecord = async (orderNum, mode) => {
  let     connection = await pool.getConnection();
  tableName = mode ? "m" : "b"
  try {

    const updateQuery = `
      UPDATE ${tableName}_temp
      SET Checked = 1
      WHERE OrderNum = ?;
    `;
    await connection.query(updateQuery, [orderNum]);

  } catch (error) {
    console.error('Error updating record in database:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release(); // 연결 반환
    }
  }
};

const fetchRecordData = async (mode) => {
  const connection = await pool.getConnection();
  const tableName = mode ? "m" : "b";

  try {
    const query = `
      SELECT OrderNum, Date, Winner, win2, win3, win4, Loser, lose2, lose3, lose4, wscore, lscore
      FROM ${tableName}_record
      ORDER BY OrderNum DESC;
    `;
    const allRecords = await connection.query(query);

    // 날짜 형식 포맷 변경
    const formattedRecords = allRecords.map(record => {
      return {
        ...record,
        Date: new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(new Date(record.Date))
      };
    });

    return formattedRecords;
  } catch (error) {
    console.error('Error fetching record data:', error);
    throw error;
  } finally {
    connection.release();
  }
};


// 승인 대기중인 기록 불러오기 (b_temp)
const fetchPendingRecords = async (nickname, mode) => {
  const connection = await pool.getConnection();
  const tableName = mode ? "m_temp" : "b_temp";
  try {
    const query = `
      SELECT OrderNum, Date, Loser, Winner, Win2, Win3, Win4, Lose2, Lose3, Lose4, WScore, LScore
      FROM ${tableName}
      WHERE Checked = 0 AND Winner = ?;
    `;

    const results = await connection.query(query, [nickname]);
    return results;
  } catch (error) {
    console.error(`Error fetching data`, error);
    return [];
  } finally {
    connection.release();
  }
};


const challengelose = async (mode, winner, loser) => {
  

    const currentDate = moment().utcOffset('+0900').format('YYYY-MM-DD HH:mm:ss');
    const values = createRecordValues(winner, currentDate, loser);
    const query = `
      INSERT INTO ${mode}_temp (Date, Winner, Loser, Checked)
      VALUES (?, ?, ?, ?);
    `;



try{
  const connection = await pool.getConnection();

    await connection.query(query, values);
 const [orderNum] = await connection.query(`SELECT Max(OrderNum) AS recent from ${mode}_temp`)
    connection.release();
    
    
    const result = await approveRecord(orderNum.recent, mode==="m");

    const RemoveChallengaQuery = `UPDATE ${mode}_user SET Challenge = NULL, ChallengeDate = NULL WHERE Nickname = ?`
    await connection.query(RemoveChallengaQuery, [winner])

  }
  catch (error) {
    console.error(`Error fetching data`, error);
  }

}


module.exports = {
  createRecordValues,
  approveRecord,
  deleteRecord,
  fetchRecordData,
  fetchPendingRecords,
  challengelose,
};
