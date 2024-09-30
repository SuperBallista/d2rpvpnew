const createConnectionPool = require('../utils/dbConnection');
const pool = createConnectionPool();

// 과거 기록 불러오기
const fetchOldRecords = async (tablePrefix) => {
  const connection = await pool.getConnection();
  try {
    const yearmonth = await connection.query(`
      SELECT DISTINCT year, month
      FROM (
        SELECT 
        YEAR(DATE_SUB(Month, INTERVAL 1 MONTH)) AS year,
        MONTH(DATE_SUB(Month, INTERVAL 1 MONTH)) AS month,
        ROW_NUMBER() OVER (PARTITION BY YEAR(Month), MONTH(Month) ORDER BY Month) AS row_num
        FROM ${tablePrefix}oldrecord
      ) subquery
      WHERE row_num = 1;
    `);
    const data = await connection.query(`
      SELECT YEAR(DATE_SUB(Month, INTERVAL 1 MONTH)) AS year,
             MONTH(DATE_SUB(Month, INTERVAL 1 MONTH)) AS month,
             Nickname, 
             Bscore + LScore AS tscore 
      FROM ${tablePrefix}oldrecord
      WHERE Nickname != "admin${tablePrefix === 'm_' ? '_m' : ''}"
      ORDER BY tscore DESC;
    `);
    return { yearmonth, data: data.map(row => ({ ...row, year: Number(row.year), month: Number(row.month) })) };
  } finally {
    connection.release();
  }
};

// 과거 히스토리 데이터 불러오기
const fetchOldHistory = async (tablePrefix) => {
  const connection = await pool.getConnection();
  try {
    const allrecord = await connection.query(`
      SELECT OrderNum, Date, Winner, Win2, Win3, Win4, Loser, Lose2, Lose3, Lose4, WScore, LScore
      FROM ${tablePrefix}oldhistory
      ORDER BY OrderNum DESC;
    `);

    return allrecord.map(record => ({
      ...record,
      Date: new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(record.Date))
    }));
  } finally {
    connection.release();
  }
};

// 순위 데이터 가져오기
const fetchRankData = async (tablePrefix) => {
  const connection = await pool.getConnection();
  try {
    const data = await connection.query(`
      SELECT Nickname AS name
      FROM ${tablePrefix}user
      ORDER BY BScore + LScore DESC
    `);

    const list = data.map(row => row.name);
    const rank = list.map((_, index) => index + 1);  // 순위 생성

    return { nicknamelist: list, rank: rank };
  } finally {
    connection.release();
  }
};

module.exports = {
  fetchOldRecords,
  fetchOldHistory,
  fetchRankData
};
