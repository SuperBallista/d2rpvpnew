const jwtService = require('../services/jwtService');  // JWT 관련 서비스 파일을 불러옴
const crypto = require('crypto');


const moment = require('moment');
const bcrypt = require('bcrypt');
const createConnectionPool = require('../utils/dbConnection');  // DB 연결 풀 가져오기
const pool = createConnectionPool();  // MariaDB 풀 생성
const { startscore, startscore_b } = require('../utils/scoreUtils');  // 점수 유틸리티 임포트




const processNicknameCheck = async (req, res) => {


  const invalidCharRegex = /[0-9_\s]/;
  function validateInput(input) {
    return invalidCharRegex.test(input); // 금지된 문자가 포함되어 있으면 true 반환
  }
  if (validateInput(req.body.nickname)) {
    return res.status(400).json({ error: "입력값에는 숫자, 밑줄(_), 띄어쓰기를 사용할 수 없습니다." });
  }


  const connection = await pool.getConnection();


 try{
  const [result] = await connection.query(`SELECT Nickname from b_user WHERE Nickname = ?`, [req.body.nickname])

  if (result) {
return res.status(403).send("중복")
  } else {
    return res.status(200).send("사용가능")
 }
}
catch (error) {
  return res.status(500).send(`Server Error`)
}

finally {
  connection.release();
}


};



const processNicknameCheckM = async (req, res) => {


  const invalidCharRegex = /[0-9_\s]/;
  function validateInput(input) {
    return invalidCharRegex.test(input); // 금지된 문자가 포함되어 있으면 true 반환
  }
  if (validateInput(req.body.nickname)) {
    return res.status(400).json({ error: "입력값에는 숫자, 밑줄(_), 띄어쓰기를 사용할 수 없습니다." });
  }

  const connection = await pool.getConnection();


 try{
  const [result] = await connection.query(`SELECT Nickname from m_user WHERE Nickname = ?`, [req.body.nickname+'_m'])

  if (result) {
return res.status(403).send("중복")
  } else {
    return res.status(200).send("사용가능")
 }
}
catch (error) {
  return res.status(500).send(`Server Error`)

}

finally {
  connection.release();
}
};


// CSRF 토큰 생성 함수
const createCsrfToken = () => {
  return crypto.randomBytes(24).toString('hex');
};

// 일반 로그인 처리 함수 (CSRF 토큰 쿠키로 저장)
const processLogin = async (req, res) => {
  const { nickname, password } = req.body;
  const connection = await pool.getConnection();

  try {
    const lowerCaseNickname = nickname.toLowerCase();

    // 사용자 정보 조회
    const result = await connection.query('SELECT * FROM b_user WHERE Nickname = ?', [lowerCaseNickname]);

    if (result.length === 0) {
      return res.status(401).send('There is no ID in DB');
    }

    const hashedPassword = result[0].PW;
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    if (isPasswordValid) {
      // JWT 및 Refresh Token 생성
      const token = jwtService.createAccessToken(lowerCaseNickname);
      const refreshToken = jwtService.createRefreshToken(lowerCaseNickname);

      // CSRF 토큰 생성
      const csrfToken = createCsrfToken();

      // Refresh Token을 httpOnly 쿠키에 저장
      res.cookie('d2rpvprefreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.HTTPS === 'true', // HTTPS 환경에서만 사용
        sameSite: 'strict',
        maxAge: 604800000,  // 7일
      });

      // CSRF 토큰을 클라이언트의 쿠키에 저장 (httpOnly는 사용하지 않음)
      res.cookie('csrfToken', csrfToken, {
        httpOnly: false, // CSRF 토큰은 클라이언트 측에서 접근 가능해야 함
        secure: process.env.HTTPS === 'true', // HTTPS에서만 사용
        sameSite: 'strict',
        maxAge: 3600000,  // 1시간
      });

      // JWT 토큰을 노출 가능한 헤더에 저장
      res.setHeader('Access-Control-Expose-Headers', 'd2rpvpjwtToken');
      res.setHeader('d2rpvpjwttoken', token);

      // 응답으로 사용자 정보 전송 (CSRF 토큰은 이미 쿠키에 저장됨)
      return res.status(200).json({ username: lowerCaseNickname });
    } else {
      return res.status(401).send('Password is Uncorrected');
    }
  } catch (error) {
    console.error('데이터베이스 오류:', error);
    return res.status(500).send('Server Error');
  } finally {
    connection.release();
  }
};

// m_user 로그인 처리 함수 (CSRF 토큰 쿠키로 저장)
const processLoginM = async (req, res) => {
  const { nickname, password } = req.body;
  const connection = await pool.getConnection();

  try {
    const lowerCaseNickname = nickname.toLowerCase() + "_m";

    const result = await connection.query('SELECT * FROM m_user WHERE Nickname = ?', [lowerCaseNickname]);

    if (result.length === 0) {
      return res.status(401).send('There is no ID in DB');
    }

    const hashedPassword = result[0].PW;
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    if (isPasswordValid) {
      // JWT 및 Refresh Token 생성
      const token = jwtService.createAccessToken(lowerCaseNickname);
      const refreshToken = jwtService.createRefreshToken(lowerCaseNickname);

      // CSRF 토큰 생성
      const csrfToken = createCsrfToken();

      // Refresh Token을 httpOnly 쿠키에 저장
      res.cookie('d2rpvprefreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.HTTPS, // HTTPS에서만 사용
        sameSite: 'strict',
        maxAge: 604800000,  // 7일
      });

      // CSRF 토큰을 클라이언트의 쿠키에 저장 (httpOnly는 사용하지 않음)
      res.cookie('csrfToken', csrfToken, {
        httpOnly: false, // CSRF 토큰은 클라이언트 측에서 접근 가능해야 함
        secure: process.env.HTTPS === 'true', // HTTPS에서만 사용
        sameSite: 'strict',
        maxAge: 3600000,  // 1시간
      });

      // JWT 토큰을 노출 가능한 헤더에 저장
      res.setHeader('Access-Control-Expose-Headers', 'd2rpvpjwtToken');
      res.setHeader('d2rpvpjwttoken', token);

      // 응답으로 사용자 정보 전송 (CSRF 토큰은 이미 쿠키에 저장됨)
      return res.status(200).json({ username: lowerCaseNickname });


      

    } else {
      return res.status(401).send('Password is Uncorrected');
    }
  } catch (error) {
    console.error('데이터베이스 오류:', error);
    return res.status(500).send('Server Error');
  } finally {
    connection.release();
  }
};


// 일반 회원가입 처리 함수
const processRegi = async (req, res) => {
  const { nickname, password, email, wgrade } = req.body;

  const invalidCharRegex = /[0-9_\s]/;
  function validateInput(input) {
    return invalidCharRegex.test(input); // 금지된 문자가 포함되어 있으면 true 반환
  }
  if (validateInput(nickname)) {
    return res.status(400).json({ error: "입력값에는 숫자, 밑줄(_), 띄어쓰기를 사용할 수 없습니다." });
  }


  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const currentDate = moment().utcOffset('+0900').format('YYYY-MM-DD HH:mm:ss');

    // DB 연결 가져오기
    const connection = await pool.getConnection();

    const lowerCaseNickname = nickname.toLowerCase();

    const result = await connection.query(
      'INSERT INTO b_user (Nickname, PW, email, BScore, LScore, Class, Lastgame) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [lowerCaseNickname, hashedPassword, email, startscore, 0, wgrade, currentDate]
    );

    connection.release();
    console.log(`${lowerCaseNickname} babapk 계정 등록`);

    res.json({ success: true, message: '회원가입이 완료되었습니다.' });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// m_user 회원가입 처리 함수
const processRegiM = async (req, res) => {
  const { nickname, password, email, wgrade } = req.body;

  const invalidCharRegex = /[0-9_\s]/;
  function validateInput(input) {
    return invalidCharRegex.test(input); // 금지된 문자가 포함되어 있으면 true 반환
  }
  if (validateInput(nickname)) {
    return res.status(400).json({ error: "입력값에는 숫자, 밑줄(_), 띄어쓰기를 사용할 수 없습니다." });
  }


  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const currentDate = moment().utcOffset('+0900').format('YYYY-MM-DD HH:mm:ss');

    const connection = await pool.getConnection();

    const lowerCaseNickname = nickname.toLowerCase() + '_m';

    const result = await connection.query(
      'INSERT INTO m_user (Nickname, PW, email, BScore, LScore, Class, Lastgame) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [lowerCaseNickname, hashedPassword, email, startscore_b, 0, wgrade, currentDate]
    );

    connection.release();
    console.log(`${lowerCaseNickname} mpk 계정 등록`);

    res.json({ success: true, message: '회원가입이 완료되었습니다.' });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};


//Jwt 체크 함수
const checkJwt = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache'); // 캐시를 사용하지 않도록 설정

      // CSRF 토큰 생성
      const csrfToken = createCsrfToken();

      // CSRF 토큰을 클라이언트의 쿠키에 저장 (httpOnly는 사용하지 않음)
      res.cookie('csrfToken', csrfToken, {
        httpOnly: false, // CSRF 토큰은 클라이언트 측에서 접근 가능해야 함
        secure: process.env.HTTPS, // HTTPS에서만 사용
        sameSite: 'strict',
        maxAge: 3600000,  // 1시간
      });

    if (!req.user) {
      return res.status(403).json({ authenticated: false });
    }
    
   // Content-Type 헤더를 명시적으로 설정
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ authenticated: true, username: req.user.username });

  } catch (err) {
    console.error("Error in checkJwt:", err);
    res.status(500).json({ authenticated: false, message: "서버 오류" });
  }
};



// 내보내기
module.exports = {
  processLogin,
  processLoginM,
  processRegi,
  processRegiM,
  checkJwt,
  processNicknameCheck,
  processNicknameCheckM
};

