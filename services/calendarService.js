const createConnectionPool = require('../utils/dbConnection');
const pool = createConnectionPool();

// 이벤트 텍스트 불러오기 (일반, m_user 구분)
const fetchEventText = async (yearmonth, tableSuffix = '') => {
  const connection = await pool.getConnection();
  try {
    const getQuery = `SELECT text, date FROM ${tableSuffix}calendar WHERE yearmonth = ?`;
    const eventtext = await connection.query(getQuery, [yearmonth]);
    return eventtext;
  } finally {
    connection.release();
  }
};

// 이벤트 텍스트 기록하기 (일반, m_user 구분)
const saveEventText = async ({ yearmonth, yearmonthdate, date, text }, tableSuffix) => {
  const connection = await pool.getConnection();
  try {
    await connection.query(`DELETE FROM ${tableSuffix}calendar WHERE yearmonthdate = ?`, [yearmonthdate]);
    const writetextQuery = `INSERT INTO ${tableSuffix}calendar (yearmonth, yearmonthdate, date, text) VALUES (?, ?, ?, ?)`;
    await connection.query(writetextQuery, [yearmonth, yearmonthdate, date, text]);
  } finally {
    connection.release();
  }
};


module.exports = {
  fetchEventText,
  saveEventText,
};
