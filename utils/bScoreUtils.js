// BScore 업데이트
const updateUserBScore = async (connection, newBScore, nickname) => {
    const updateQuery = `UPDATE b_user SET BScore = ? WHERE Nickname = ?;`;
    await connection.query(updateQuery, [newBScore, nickname]);
  };
  
  // BScore 조회
  const getBScore = async (connection, nickname) => {
    if (!nickname) return 0;
    
    const query = `SELECT BScore FROM b_user WHERE nickname = ?;`;
    const result = await connection.query(query, [nickname]);
    return result[0]?.BScore || 0;
  };


const kvalue = 32;
const evalue = 400;
  
  module.exports = {
    updateUserBScore,
    getBScore,
    kvalue,
    evalue
  };
  