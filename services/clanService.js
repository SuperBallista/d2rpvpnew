const createConnectionPool = require('../utils/dbConnection');
const pool = createConnectionPool();

const clanListService = async () => {
    const connection = await pool.getConnection(); // 커넥션 가져오기
    try {
        const clanlistquery = `SELECT Name FROM m_clan`; // 쿼리문
        const row = await connection.query(clanlistquery); // 결과를 배열로 반환
        const clannamelist = row.map(row => row.Name); // 배열에서 Name 필드 추출
        return clannamelist; // 클랜 이름 목록 반환
    } catch (error) {
        console.error("서버 DB 에러입니다", error); // 에러 로깅
        throw error; // 에러를 호출자에게 전달
    } finally {
        connection.release(); // 커넥션을 항상 반환
    }
};




const clanJoinService = async (nickname, clan) => {
    const connection = await pool.getConnection();
    try {
    const checkclanQuery = `select clan from m_user where Nickname = ?`
    
    const checkclanname = await connection.query(checkclanQuery,[nickname])

    if (checkclanname[0].clan === 'none') {
        const joinclanQuery = 'update m_user set clan = ? where Nickname = ?'
        await connection.query(joinclanQuery,[clan, nickname])
        return 'ok'
    } else {
        return 'error'
    }
    }
    catch (error) {
        console.error("서버 DB 에러입니다", error);
    }finally {    
    connection.release();
    }

}

const clanResetService = async (nickname) => {
const connection = await pool.getConnection();
try {
    const resetClanQuery = `update m_user set clan = 'none' where Nickname = ?`
    await connection.query(resetClanQuery,[nickname])
    return 'ok'
} catch (error) {
    return 'error'
}
finally{
    connection.release();
}
}

const adminClanScoreService = async(clan, clanScore) =>{
const connection = await pool.getConnection();
try {
    const clanScoreQuery = `update m_clan set Score = Score + ? where Name = ?`
    await connection.query(clanScoreQuery,[clanScore,clan])
    return 'ok'
} catch (error) {
    return 'error'
} finally{
    connection.release();
}

}

const createClanObject = async (clans, playerdb) => {
    let clandb = clans;
    const connection = await pool.getConnection();
    try {
        const countsQuery = (game) => `
            SELECT count(*) as count
            FROM m_clanrecord
            WHERE ${game} = ?
        `;
        const clanCheckQuery = `SELECT clan, Nickname FROM m_user WHERE Nickname = ?`;

        for (let i = 0; i < clandb.length; i++) {  // 조건 수정
            let clanWins = 0;
            let clanLoses = 0;
            let clanDraws = 0;
            let clanMember = '';  // 각 클랜마다 초기화

            for (let index = 0; index < playerdb.length; index++) {  // 조건 수정
                const clanCheck = await connection.query(clanCheckQuery, [playerdb[index].Nickname]);

                if (clanCheck.length > 0 && clanCheck[0].clan == clandb[i].Name) {  // 조건 수정

                    const [wincounts] = await connection.query(countsQuery('winner'), [playerdb[index].Nickname]);
                    const [losecounts] = await connection.query(countsQuery('loser'), [playerdb[index].Nickname]);
                    const [drawcounts1] = await connection.query(countsQuery('draw1'), [playerdb[index].Nickname]);
                    const [drawcounts2] = await connection.query(countsQuery('draw2'), [playerdb[index].Nickname]);

                    clanMember += " " + clanCheck[0].Nickname.replace("_m","");

                    clanWins += Number(wincounts.count);
                    clanLoses += Number(losecounts.count);
                    clanDraws += Number(drawcounts1.count + drawcounts2.count);
                }
            }

            // clandb의 값을 업데이트
            clandb[i].wins = clanWins;
            clandb[i].loses = clanLoses;
            clandb[i].draws = clanDraws;
            clandb[i].member = clanMember.trim();  // 문자열 앞뒤 공백 제거
        }

        
    } catch (error) {
        console.error('Error:', error);
        return 'error';
    } finally {
        connection.release();
        return clandb;
    }
};

const clanRecordService = async () => {
    const connection = await pool.getConnection();
  
    try {
      const query = `
        SELECT *
        FROM m_clanrecord
        ORDER BY OrderNumber DESC;
      `;

      const findclanQuery = `
      select clan from m_user where Nickname = ?`
      const allRecords = await connection.query(query);
  
      // 비동기 처리에서 map과 Promise.all 사용
      const formattedRecords = await Promise.all(
        allRecords.map(async (record) => {
          // winner가 null인 경우 '무승부' 처리
          if (record.winner === null) {
            const [winnerClanResult] = await connection.query(findclanQuery, [record.draw1]);
            const [loserClanResult] = await connection.query(findclanQuery, [record.draw2]);
           
            return {
              ...record,
              winnerClan: winnerClanResult.clan,  // winnerClan 값 처리
              loserClan: loserClanResult.clan ,   // loserClan 값 처리
              gameDate: new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone: 'Asia/Seoul'  // 한국 시간으로 변환
              }).format(new Date(record.gameDate)),
              result: '무', // result에 '무' 추가
              winner: record.draw1, // draw1 값을 winner로
              loser: record.draw2   // draw2 값을 loser로
            };
          } else {
            const [winnerClanResult] = await connection.query(findclanQuery, [record.winner]);
            const [loserClanResult] = await connection.query(findclanQuery, [record.loser]);
            return {
              ...record,
              winnerClan: winnerClanResult.clan, // winnerClan 값 처리
              loserClan: loserClanResult.clan,   // loserClan 값 처리
              gameDate: new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              }).format(new Date(record.gameDate)),
              result: '',
            };
          }
        })
      );
  
      return formattedRecords;
    } catch (error) {
      console.error('Error fetching record data:', error);
      throw error;
    } finally {
      connection.release();
    }
  };
    
const clanRecordDelteService = async (OrderNumber) => {
  const connection = await pool.getConnection();
try{
  await connection.beginTransaction();

  const selectNicknameQuery = (column) => `
  SELECT ${column}
  FROM m_clanrecord
  WHERE OrderNumber = ?
`;
const findClanQuery = `Select clan from m_user where Nickname = ?`
const cancelScoreQuery = `UPDATE m_clan SET Score = Score - ? Where Name = ?`
const deletequery = `DELETE from m_clanrecord where OrderNumber = ?`



const [winner] = await connection.query(selectNicknameQuery('winner'),[OrderNumber])

if (winner.winner) {

const [winnerClan] = await connection.query(findClanQuery,[winner.winner])
await connection.query(cancelScoreQuery,[3, winnerClan.clan])

} else {

const [draw1] = await connection.query(selectNicknameQuery('draw1'),[OrderNumber])
const [draw2] = await connection.query(selectNicknameQuery('draw2'),[OrderNumber])
const [draw1Clan] = await connection.query(findClanQuery,[draw1.draw1])
const [draw2Clan] = await connection.query(findClanQuery,[draw2.draw2])


await connection.query(cancelScoreQuery,[1, draw1Clan.clan])
await connection.query(cancelScoreQuery,[1, draw2Clan.clan])

}

await connection.query(deletequery,[OrderNumber])

await connection.commit();

return '클랜 기록 삭제 완료했습니다.'

}catch (error) {
  console.error('Error removing record data:', error);
  throw error;
} finally {
  connection.release();
}


};

const clanRecordSubmitService = async (loser, winner, result) => {

  const connection = await pool.getConnection();

  try {

    const checkclan = `select clan from m_user where Nickname = ?`

    const [winnerclan] = await connection.query(checkclan,[winner])
    const [loserclan] = await connection.query(checkclan,[loser])
    
    if (winnerclan.clan==='none' || loserclan.clan==='none' || winnerclan.clan===loserclan.clan ) {
      return 'no clan error'
    }

else {

      const recordtempQuery = result ? `INSERT into m_clanrecordtemp (winner, loser, gameDate) value (?, ?, ?)` : `INSERT into m_clanrecordtemp (draw1, draw2, gameDate) value (?, ?, ?)`
      const today = new Date();

      await connection.query(recordtempQuery,[winner, loser, today]);
     
      return 'ok'
    }
  } catch (error) {
    console.error('Error recording data:', error);
    throw error;
  } finally {
    connection.release();
  }
  
}

 const clanNoApprovedRecordsService = async (user) => {

  const connection = await pool.getConnection();

  const showtempRecordQuery = `select * from m_clanrecordtemp where winner = ? or draw1 = ?`
  
try{
let temprecord = await connection.query(showtempRecordQuery,[user, user]);


temprecord = temprecord.map((record) => {
  if (record.winner === null) {
    return {
      ...record,
      result: "draw",
      winner: record.draw1,
      loser: record.draw2,
    };
  }
  return {
    ...record,
    result: "win",
  };
});


return temprecord

}catch (error) {
    console.error('Error recording data:', error);
    throw error;
  } finally {
    connection.release();
  }
  
  

 }


const clanRecordCancelService = async (OrderNumber) => {

  const connection = await pool.getConnection();

  const deleteTempQuery = `DELETE from m_clanrecordtemp where OrderNum = ?`
  
  try {
  
await connection.query(deleteTempQuery,[OrderNumber])

return "ok"
  }
  catch (error) {
    console.error('Error removing data:', error);
    throw error;
  } finally {
    connection.release();
  }
  
}

const clanRecordAcceptService = async (OrderNumber, result) => {

  const connection = await pool.getConnection();
  const selectTempRecordQuery = `select * from m_clanrecordtemp where OrderNum = ?`
  const findClanQuery = `Select clan from m_user where Nickname = ?`
  const AddScoreQuery = `UPDATE m_clan SET Score = Score + ? Where Name = ?`
  const writeRecordQuery = `INSERT Into m_clanrecord (winner, loser, draw1, draw2, gameDate) values (?, ?, ?, ?, ?)`
  const deleteTempQuery = `DELETE from m_clanrecordtemp where OrderNum = ?`

  try {
    await connection.beginTransaction();

const [TempRecord] = await connection.query(selectTempRecordQuery,[OrderNumber])

if (result === 'draw')
{
const [draw1Clan] = await connection.query(findClanQuery,[TempRecord.draw1])
const [draw2Clan] = await connection.query(findClanQuery,[TempRecord.draw2])
await connection.query(AddScoreQuery,[1,draw1Clan.clan])
await connection.query(AddScoreQuery,[1,draw2Clan.clan])
await connection.query(writeRecordQuery,[TempRecord.winner,TempRecord.loser,TempRecord.draw1,TempRecord.draw2,TempRecord.gameDate])
}
else
{
  const [winnerClan] = await connection.query(findClanQuery,[TempRecord.winner])
  await connection.query(AddScoreQuery,[3,winnerClan.clan])
  await connection.query(writeRecordQuery,[TempRecord.winner,TempRecord.loser,TempRecord.draw1,TempRecord.draw2,TempRecord.gameDate])
  }

await connection.query(deleteTempQuery,[OrderNumber])
await connection.commit()

  return "ok"
}
catch (error) {
  console.error('Error removing data:', error);
  throw error;
} finally {
  connection.release();
}


}


module.exports = {
    clanJoinService,
    clanListService,
    clanResetService,
    adminClanScoreService,
    createClanObject,
    clanRecordService,
    clanRecordDelteService,
    clanRecordSubmitService,
    clanNoApprovedRecordsService,
    clanRecordCancelService,
    clanRecordAcceptService
  };