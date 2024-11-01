const createConnectionPool = require('../utils/dbConnection');
const pool = createConnectionPool();

// 승인된 기록 삭제 및 점수 수정 로직
const deleteRecord = async (OrderNum, RecordTable, UserTable) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 기록 가져오기
    const selectRecordQuery = `
      SELECT Winner, Win2, Win3, Win4, Loser, Lose2, Lose3, Lose4, AddScore, LScore
      FROM ${RecordTable}
      WHERE OrderNum = ?;
    `;
    const recordRow = await connection.query(selectRecordQuery, [OrderNum]);

    if (recordRow.length === 0) {
      throw new Error('Row not found');
    }

    const winnerNicknames = [recordRow[0].Winner, recordRow[0].Win2, recordRow[0].Win3, recordRow[0].Win4];
    const loserNicknames = [recordRow[0].Loser, recordRow[0].Lose2, recordRow[0].Lose3, recordRow[0].Lose4];
    const addScore = Number(recordRow[0].AddScore);

    // 점수 업데이트 쿼리
    const updateScoreQuery = `
      UPDATE ${UserTable}
      SET BScore = BScore - ?
      WHERE Nickname IN (?, ?, ?, ?);
    `;
    const updateRecordsQuery = `
    UPDATE ${UserTable}
    SET Records = Records - 1
    WHERE Nickname IN (?, ?, ?, ?)`;
    


    // 승자 점수 수정
    await connection.query(updateScoreQuery, [addScore, ...winnerNicknames]);

    // 패자 점수 수정
    const subtractScore = 0 - addScore;
    await connection.query(updateScoreQuery, [subtractScore, ...loserNicknames]);

    await connection.query(updateRecordsQuery, [...winnerNicknames])
    await connection.query(updateRecordsQuery, [...loserNicknames])



    // 기록 삭제
    const deleteRecordQuery = `
      DELETE FROM ${RecordTable}
      WHERE OrderNum = ?;
    `;
    await connection.query(deleteRecordQuery, [OrderNum]);

    await connection.commit(); // 트랜잭션 커밋
  } catch (error) {
    await connection.rollback(); // 트랜잭션 롤백
    console.error('Error deleting record:', error);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  deleteRecord,
};
