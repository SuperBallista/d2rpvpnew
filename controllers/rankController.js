const createConnectionPool = require('../utils/dbConnection');
const rankService = require('../services/rankService');
const pool = createConnectionPool(); // MariaDB 풀 생성

// b_user 랭킹 데이터 처리 함수
const getRankData = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // b_user 테이블에서 데이터 가져오기
    const rankdb = await connection.query(`
      SELECT Nickname, BScore, LScore, RScore, Class, Lastgame, Records 
      FROM b_user 
      WHERE Nickname != "admin" 
    `, [rankService.RecordScore]);

    const [recordWin, recordLose] = await Promise.all([
      connection.query(rankService.getWinCountQuery('b_record', 'b_user')),
      connection.query(rankService.getLoseCountQuery('b_record', 'b_user'))
    ]);

    const result = rankService.createResultArray(rankdb, recordWin, recordLose, false);
    connection.release();

    res.json(result);
  } catch (error) {
    console.error('데이터베이스 오류:', error);
    res.status(500).json({ error: 'DB Error' });
  }
};

// m_user 랭킹 데이터 처리 함수
const getRankDataM = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // m_user 테이블에서 데이터 가져오기
    const rankdb = await connection.query(`
      SELECT Nickname, BScore, LScore, RScore, Class, Lastgame, Records, clan 
      FROM m_user 
      WHERE Nickname != "admin_m" 
    `, [rankService.RecordScore]);

    const [recordWin, recordLose] = await Promise.all([
      connection.query(rankService.getWinCountQuery('m_record', 'm_user')),
      connection.query(rankService.getLoseCountQuery('m_record', 'm_user'))
    ]);

    const result = rankService.createResultArray(rankdb, recordWin, recordLose, true);
    connection.release();

    res.json(result);
  } catch (error) {
    console.error('데이터베이스 오류:', error);
    res.status(500).json({ error: 'DB Error' });
  }
};



const challengeRank = async (req, res) => {
  const tableName = req.body.mode ? "m" : "b";

  try {
    
    const connection = await pool.getConnection();
    const Challenger = req.user.username
    const Ranker = req.body.nickname



    const OpponentCheckQuery = `SELECT PlayStop FROM ${tableName}_user WHERE Nickname = ?`;
    const [opponentResult] = await connection.query(OpponentCheckQuery, [Ranker]);


    if (opponentResult.PlayStop === 1) {
      return res.status(403).json({ error: '상대가 휴가중입니다' });
    }


    const MyChallengeCheckQuery = `SELECT Challenge FROM ${tableName}_user WHERE Nickname = ?`;
    const [myChallengeResult] = await connection.query(MyChallengeCheckQuery, [Challenger]);



    if (myChallengeResult.Challenge) {
      return res.status(400).json({ error: '당신은 이미 도전중인 상대가 있습니다' });
    }


    const today = new Date();
    today.setHours(today.getHours() + 9);
    const formattedDate = today.toISOString().slice(0, 10); // 'YYYY-MM-DD' 형식


    console.log(Ranker, formattedDate, Challenger)

    const InputChallengeDataQuery = `UPDATE ${tableName}_user SET Challenge = ?, ChallengeDate = ? WHERE Nickname = ?`;
    const updateResult = await connection.query(InputChallengeDataQuery, [Ranker, formattedDate, Challenger]);

    // 쿼리 실행 결과 확인 및 로그 출력
    if (updateResult.affectedRows > 0) {
      console.log("Challenge update successful:", updateResult);
      res.status(200).json({ success: '도전이 성공적으로 등록되었습니다' });
    } else {
      console.error("Update failed: No rows affected.");
      res.status(500).json({ error: '업데이트 실패: 영향을 받은 행이 없습니다' });
    }

    connection.release();
    } catch (error) {
      console.error("DB Error:", error); // 에러 로그 출력
      res.status(500).json({ error: '서버 오류입니다' });
      }
};

const challengeDataM = async (req, res) => {
  const connection = await pool.getConnection();
const DataQuery = `SELECT Nickname, ChallengeDate from m_user WHERE Challenge = ?`;
try {
  const challengeDB = await connection.query(DataQuery,[req.user.username])
  res.status(200).json(challengeDB);
}
finally{
  connection.release();
}

}



module.exports = {
  getRankData,
  getRankDataM,
  challengeRank,
  challengeDataM
};
