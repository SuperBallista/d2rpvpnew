const { RecordScore } = require('../utils/scoreUtils');  // 점수 유틸리티 임포트


// 승리 기록 쿼리
const getWinCountQuery = (recordTable, userTable) => `
  SELECT
    ${userTable}.Nickname,
    COALESCE(SUM(CASE WHEN ${userTable}.Nickname IN (${recordTable}.Winner, ${recordTable}.win2, ${recordTable}.win3, ${recordTable}.win4) THEN 1 ELSE 0 END), 0) AS TotalWins
  FROM ${userTable}
  LEFT JOIN ${recordTable} ON ${userTable}.Nickname IN (${recordTable}.Winner, ${recordTable}.win2, ${recordTable}.win3, ${recordTable}.win4)
  GROUP BY ${userTable}.Nickname;
`;

// 패배 기록 쿼리
const getLoseCountQuery = (recordTable, userTable) => `
  SELECT
    ${userTable}.Nickname,
    COALESCE(SUM(CASE WHEN ${userTable}.Nickname IN (${recordTable}.Loser, ${recordTable}.lose2, ${recordTable}.lose3, ${recordTable}.lose4) THEN 1 ELSE 0 END), 0) AS TotalLoses
  FROM ${userTable}
  LEFT JOIN ${recordTable} ON ${userTable}.Nickname IN (${recordTable}.Loser, ${recordTable}.lose2, ${recordTable}.lose3, ${recordTable}.lose4)
  GROUP BY ${userTable}.Nickname;
`;

// 결과 객체 생성 함수


const createResultArray = (rankdb, recordWin, recordLose, mode) => {
const result = []
for (let i = 0; i < rankdb.length; i++){

  const totalBScore = mode? 0 : Math.round(rankdb[i].BScore * 100) / 100 + ((rankdb[i].Records > 15 ? 15 : rankdb[i].Records) * RecordScore);
  
  const wins = recordWin===0 ? 0 : Number(recordWin.find(record => record.Nickname === rankdb[i].Nickname)?.TotalWins) || 0;
  const losses = recordLose===0 ? 0 : Number(recordLose.find(record => record.Nickname === rankdb[i].Nickname)?.TotalLoses) || 0;

const member = {
    nickname: rankdb[i].Nickname,
    RScore: rankdb[i].RScore,
    LScore: rankdb[i].LScore,
    BScore: totalBScore,
    wins: wins,
    loses: losses,
    rank: i+1,
    clan: rankdb[i].clan
  }

result.push(member)
}
  return result;
};

module.exports = {
  getWinCountQuery,
  getLoseCountQuery,
  createResultArray
};
