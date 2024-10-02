const clanService = require('../services/clanService');
const createConnectionPool = require('../utils/dbConnection');
const pool = createConnectionPool(); // MariaDB 풀 생성


// 클랜리스트 출력하기
const clanlist = async (req, res) =>{
try{
    const result = await clanService.clanListService();
    res.status(200).json(result);
}
catch (error) {
    console.error('클랜 목록 출력 오류:', error);
    res.status(500).json({error: '서버오류'});
}

}


// m_user 클랜 등록
const clanJoin = async (req, res) => {
    try {
      const userNickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용
  
      const result = await clanService.clanJoinService(userNickname, req.body.clanname);

      if (result==='error'){
        res.status(405).json({ error: '서버 오류' });
   
      } else if (result==='ok')
{res.status(200).json()

}      

      
    } catch (error) {
      console.error('클랜 가입 오류:', error);
      res.status(500).json({ error: '서버 오류' });
    }
  };
  
const clanReset = async (req, res) => {
    try{
        const userNickname = req.user.username;

        if (userNickname==="admin_m"){
        
            const result = await clanService.clanResetService(req.body.player+"_m");

            if (result==='ok'){
                res.status(200).json();
            } else {
                res.status(400).json({error: 'DB 오류'});
            }

        }
    } catch (error) {
        console.error('클랜 리셋 오류:', error);
        res.status(500).json({ error: '서버 오류' });
  
    }
}

const adminClanScore = async (req, res) =>{
    try{
        const userNickname = req.user.username;
        if (userNickname==="admin_m"){
const result = await clanService.adminClanScoreService(req.body.clan, req.body.clanScore);

if (result==='ok'){
    res.status(200).json();
} else {
    res.status(400).json({error: 'DB 오류'});
}

        }
        else {
            res.status(403).json({error: '권한 없음'});
        }

    }     catch (error) {
        console.error('클랜 점수 부여 오류:', error);
        res.status(500).json({ error: '서버 오류' });
  
    }
}
const clanRank = async (req, res) => {

try{
    const connection = await pool.getConnection();

    const clandb = await connection.query(`
        SELECT * 
        FROM m_clan 
        ORDER BY Score DESC
      `);
    const playerdb = await connection.query(`
        Select Nickname, clan
        From m_user
        `)
  
      const result = await clanService.createClanObject(clandb, playerdb);

      connection.release();

      if (result==="error") {
res.status(400).json({error: 'DB Error'});
      } else{
      res.json(result);
    }
} catch (error) {
    console.error('데이터베이스 오류:', error);
    res.status(500).json({ error: 'DB Error' });

}
}


const clanRecord = async (req, res) => {
try {
    const result = await clanService.clanRecordService();
res.status(200).json(result);
}
catch (error) {
    console.error('기록 불러오기 실패:', error);
    res.status(500).json({ error: '서버 오류' });
}

}

const clanRecordDelete = async (req, res) =>{
    const userNickname = req.user.username;

    try {

        if (userNickname==="admin_m"){

        const result = await clanService.clanRecordDelteService(req.body.OrderNumber);
    
        res.status(200).json(result);
        }
        else {
            res.status(403).json({error: '권한이 없습니다'})
        }

    }
    catch (error) {
        console.error('기록 불러오기 실패:', error);
        res.status(500).json({ error: '서버 오류' });
    }
}

const clanRecordSubmit = async (req, res) => {
    const userNickname = req.user.username;

    try {

        const result = await clanService.clanRecordSubmitService(userNickname, req.body.winner, req.body.result)

        if (result==='ok')
    {    res.status(200).json(result);}
        else if (result==='no clan error') {

            res.status(406).json('자신 또는 상대의 소속 클랜이 없거나 잘못되었습니다');
        }

    }   catch (error) {
        console.error('기록 등록 실패:', error);
        res.status(500).json({ error: '서버 오류' });
    }

}

const clanNoApprovedRecords = async (req, res) => {
    const userNickname = req.user.username;
    try {
        const result = await clanService.clanNoApprovedRecordsService(userNickname)
        
        if (result)
            {    res.status(200).json(result);}
else {

    res.status(404).json('Bad Request')
}        

}   catch (error) {
    console.error('기록 등록 실패:', error);
    res.status(500).json({ error: '서버 오류' });
}

}


const clanRecordCancel = async (req, res) => {
    const orderNum = req.body.orderNum
    try {
        const result = await clanService.clanRecordCancelService(orderNum)


        if (result==='ok')
            {    res.status(200).json(result);}
        
            }   catch (error) {
                console.error('삭제 실패:', error);
                res.status(500).json({ error: '서버 오류' });
            }
        
        
}

const clanRecordAccept = async (req, res) => {
    const orderNum = req.body.orderNum
    const draw = req.body.result
try {
const result = await clanService.clanRecordAcceptService(orderNum, draw)

if (result==='ok')
    {    res.status(200).json(result);}

    }   catch (error) {
        console.error('승인 실패:', error);
        res.status(500).json({ error: '서버 오류' });
    }


}

  module.exports = {
clanJoin,
clanlist,
clanReset,
adminClanScore,
clanRank,
clanRecord,
clanRecordDelete,
clanRecordSubmit,
clanNoApprovedRecords,
clanRecordCancel,
clanRecordAccept
  };