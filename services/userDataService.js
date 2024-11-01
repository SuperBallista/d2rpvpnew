const createConnectionPool = require('../utils/dbConnection');
const pool = createConnectionPool();


// 사용자 정보 및 전적 조회 로직
const getUserData = async (userNickname, userTable) => {
  const connection = await pool.getConnection();
  try {
    // 사용자 정보 쿼리
    const userQuery = `SELECT * FROM ${userTable} WHERE Nickname = ?`;
    const userResult = await connection.query(userQuery, [userNickname]);

    if (userResult.length === 0) {
      return null;
    }


if (userTable==="b_user") {


    // 사용자 전적 쿼리
    const recordQuery = `
      SELECT
        COUNT(*) AS countwin,
        (SELECT COUNT(*) FROM b_record WHERE Loser = ? OR lose2 = ? OR lose3 = ? OR lose4 = ?) AS countlose
      FROM b_record
      WHERE Winner = ? OR win2 = ? OR win3 = ? OR win4 = ?
    `;
    const recordResult = await connection.query(recordQuery, [
      userNickname, userNickname, userNickname, userNickname,
      userNickname, userNickname, userNickname, userNickname
    ]);

    // 사용자 정보 및 전적 데이터 반환
    return {
      nickname: userNickname,
      email: userResult[0].email,
      rscore: userResult[0].RScore.toString(),
      bscore: userResult[0].BScore.toString(),
      lscore: userResult[0].LScore.toString(),
      countwin: recordResult[0].countwin.toString(),
      countlose: recordResult[0].countlose.toString(),
      countrecord: (recordResult[0].countwin + recordResult[0].countlose).toString(),
    };

  } else {

    const clanDataQuery = `
      SELECT
        COUNT(*) AS clanwin,
        (SELECT COUNT(*) FROM m_clanrecord WHERE loser = ?) AS clanlose
      FROM m_clanrecord
      WHERE winner = ?
    `
    const clanDataDrawQuery = `
    Select count(*) AS clandraw
    From m_clanrecord Where draw1 = ? or draw2 = ?`

    const clanDataResult = await connection.query(clanDataQuery, [userNickname, userNickname])
    const clanDataDrawResult = await connection.query(clanDataDrawQuery,[userNickname, userNickname])

    const challengeDate = new Date(userResult[0].ChallengeDate);
const formattedDate = new Date(challengeDate.getTime() + 9 * 60 * 60 * 1000)  // 9시간을 더해 KST로 변환
  .toISOString()
  .slice(0, 10); // YYYY-MM-DD 형식으로 변환


    return {
      nickname: userNickname,
      email: userResult[0].email,
      lscore: userResult[0].LScore.toString(),
      clan: userResult[0].clan,
      clanwin: clanDataResult[0].clanwin.toString(),
      clanlose: clanDataResult[0].clanlose.toString(),
      clandraw: clanDataDrawResult[0].clandraw.toString(),
      Challenge: userResult[0].Challenge,
      ChallengeDate: formattedDate,
    };





  }

  } catch (error) {
    console.error('사용자 정보 및 전적 조회 오류:', error);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getUserData,
};
