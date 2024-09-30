const jwt = require('jsonwebtoken');



// JWT 토큰 검증
const verifyToken = (token, secretKey) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded.username);
    });
  });
};

// 기록 데이터를 배열로 생성
const createRecordValues = (body, currentDate, userNickname) => {
  return [
    currentDate,
    body.winner,
    userNickname,
    body.winner2,
    body.winner3,
    body.winner4,
    body.loser2,
    body.loser3,
    body.loser4,
    body.winnerScore,
    body.myScore,
    0, // Checked
  ];
};

const createConnectionPool = require('../utils/dbConnection');
const pool = createConnectionPool();
const { updateUserBScore, getBScore, kvalue, evalue } = require('../utils/bScoreUtils');  // BScore 관련 유틸리티

const approveRecord = async (orderNum) => {
  const connection = await pool.getConnection();

  try {
    // 트랜잭션 시작
    await connection.beginTransaction();

    // b_temp 테이블에서 Checked 값을 2로 업데이트
    const updateCheckedQuery = `UPDATE b_temp SET Checked = 2 WHERE OrderNum = ?;`;
    await connection.query(updateCheckedQuery, [orderNum]);

    // b_temp 테이블에서 데이터를 가져옴
    const selectQuery = `SELECT * FROM b_temp WHERE OrderNum = ?;`;
    const selectedData = await connection.query(selectQuery, [orderNum]);
    const recordData = selectedData[0];

    // b_record 테이블에 데이터 삽입
    const insertQuery = `
      INSERT INTO b_record (Date, Winner, Loser, Win2, Win3, Win4, Lose2, Lose3, Lose4, WScore, LScore)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    await connection.query(insertQuery, [
      recordData.Date, recordData.Winner, recordData.Loser, recordData.Win2,
      recordData.Win3, recordData.Win4, recordData.Lose2, recordData.Lose3,
      recordData.Lose4, recordData.WScore, recordData.LScore,
    ]);

    const no_game_score_Query = `
    UPDATE b_user
    SET Records = (IF(Records = 15, 15, Records + 1 ))
    Where Nickname = ?
    `
    

    // 점수 계산 및 업데이트
    await updateUserScores(connection, recordData);
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
const updateUserScores = async (connection, recordData) => {
  const winnerBScore = Number(await getBScore(connection, recordData.Winner));
  const loserBScore = Number(await getBScore(connection, recordData.Loser));

  const win2BScore = await getBScore(connection, recordData.Win2);
  const win3BScore = await getBScore(connection, recordData.Win3);
  const win4BScore = await getBScore(connection, recordData.Win4);

  const lose2BScore = await getBScore(connection, recordData.Lose2);
  const lose3BScore = await getBScore(connection, recordData.Lose3);
  const lose4BScore = await getBScore(connection, recordData.Lose4);

  const addScore = kvalue * (1 - (1 / (1 + 10 ** ((loserBScore - winnerBScore) / evalue))));
  const subtractScore = addScore;

  const changedscorerecord = `
  UPDATE b_record AS t1
  JOIN (
      SELECT MAX(OrderNum) AS max_order
      FROM b_record
  ) AS t2 ON t1.OrderNum = t2.max_order
  SET t1.AddScore = ?;
  `;
          
    await connection.query(changedscorerecord, [addScore]);
  


  // 점수 업데이트
  await updateUserBScore(connection, winnerBScore + addScore, recordData.Winner);
  await updateUserBScore(connection, loserBScore - subtractScore, recordData.Loser);

  if (recordData.Win2) await updateUserBScore(connection, win2BScore + addScore, recordData.Win2);
  if (recordData.Win3) await updateUserBScore(connection, win3BScore + addScore, recordData.Win3);
  if (recordData.Win4) await updateUserBScore(connection, win4BScore + addScore, recordData.Win4);

  if (recordData.Lose2) await updateUserBScore(connection, lose2BScore - subtractScore, recordData.Lose2);
  if (recordData.Lose3) await updateUserBScore(connection, lose3BScore - subtractScore, recordData.Lose3);
  if (recordData.Lose4) await updateUserBScore(connection, lose4BScore - subtractScore, recordData.Lose4);

  console.log(`Score updates completed`);
};


// 기록 삭제 로직
const deleteRecord = async (orderNum) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const updateQuery = `
      UPDATE b_temp
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

// 테이블 이름을 인수로 받아서 해당 테이블의 레코드 데이터를 가져오는 함수
const fetchRecordData = async () => {
  const connection = await pool.getConnection();

  try {
    const query = `
      SELECT OrderNum, Date, Winner, win2, win3, win4, Loser, lose2, lose3, lose4, wscore, lscore
      FROM b_record
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
const fetchPendingRecords = async (nickname) => {
  const connection = await pool.getConnection();
  try {
    const query = `
      SELECT OrderNum, Date, Loser, Winner, Win2, Win3, Win4, Lose2, Lose3, Lose4, WScore, LScore
      FROM b_temp
      WHERE Checked = 0 AND Winner = ?;
    `;

    const results = await connection.query(query, [nickname]);
    return results;
  } catch (error) {
    console.error(`Error fetching data from ${tablePrefix}temp:`, error);
    return [];
  } finally {
    connection.release();
  }
};


module.exports = {
  verifyToken,
  createRecordValues,
  approveRecord,
  deleteRecord,
  fetchRecordData,
  fetchPendingRecords,
};
