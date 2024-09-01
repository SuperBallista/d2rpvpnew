const path = require('path');
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mariadb = require('mariadb');
const bcrypt = require('bcrypt');
const moment = require('moment');
// const http = require('http');
// const WebSocket = require('ws');
const app = express();
// const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const dotenv = require('dotenv');
const cron = require('node-cron');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const axios = require('axios');
require('dotenv').config();
const secretKey = process.env.JWT_SECRET;  // 환경 변수에서 로드된 비밀 키
const refreshsecretKey = process.env.JWT_REFRESH;  // 환경 변수에서 로드된 비밀 키


// DOMPurify 설정
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);


const envPath = path.join(__dirname, '../.env');


const nodemailer = require('nodemailer');
const createTransport = nodemailer.createTransport;



// // 비밀키 생성 함수
// function generateSecretKey() {
//   return crypto.randomBytes(64).toString('hex');
// }

// function generateCookieParser() {
//   return crypto.randomBytes(64).toString('hex');
// }

// function rotateSecretKey() {
//   const newSecret = generateSecretKey();
//   let envFileContent = fs.readFileSync(envPath, 'utf-8').split('\n');
//   envFileContent[0] = `JWT_SECRET=${newSecret}`; // 1번째 줄 수정
//   fs.writeFileSync(envPath, envFileContent.join('\n'));

//   JWT_SECRET = process.env.JWT_SECRET;
// }

// function rotateCookieParser() {
//   const newParser = generateCookieParser();
//   let envFileContent = fs.readFileSync(envPath, 'utf-8').split('\n');
//   envFileContent[1] = `COOKIE_PASER=${newParser}`; // 2번째 줄 수정
//   fs.writeFileSync(envPath, envFileContent.join('\n'));

//   COOKIE_PASER = process.env.COOKIE_PASER;
// }


// rotateCookieParser();
// rotateSecretKey();

// // 비밀키 주기적으로 갱신 (예: 매일 자정)
// cron.schedule('0 0 * * *', () => {
//   rotateSecretKey();
//   rotateCookieParser();
// });




const teams2ScoreB = {Championship: 10};
const teams4ScoreB = {Championship: 10, Runner_up: 5};
const teams8ScoreB = {Championship: 20, Runner_up: 10, Place3rd: 5};
const teams16ScoreB = {Championship: 30, Runner_up: 20, Place3rd: 10};
const teams24ScoreB = {Championship: 150, Runner_up: 100, Place3rd: 50};
const teams4TScoreB = {Championship: 20, Runner_up: 10};

const teams2ScoreM = {Championship: 8};
const teams4ScoreM = {Championship: 19, Runner_up: 9};
const teams8ScoreM = {Championship: 30, Runner_up: 20, Place3rd: 10};
const teams16ScoreM = {Championship: 42, Runner_up: 32, Place3rd: 22};

const EventhostScore = 3


const updateuserBScoreQuery = `
  UPDATE b_user
  SET BScore = ?
  WHERE Nickname = ?;
`;

const updateuserBScoreQuery_m = `
UPDATE m_user
SET BScore = ?
WHERE Nickname = ?;
`;

const todaydate = moment().utcOffset('+0900').format('YYYY-MM-DD HH:mm:ss');


// 기본 설정
const startscore = 1200;
const kvalue = 32;
const evalue = 400;
const RecordScore = 20;
let add_score;
let subtractScore;

const startscore_b = 0
const wintimes = 5
const losetimes = 4.5


// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});


app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

const secret = process.env.COOKIE_PASER
app.use(cookieParser(secret));


// JSON 요청 파싱을 위한 미들웨어
app.use(express.json());


// Body parser 설정
app.use(bodyParser.json());


// 엑세스토큰 인증 미들웨어
function isAuthenticated(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1];

  if (token) {
      jwt.verify(token, secretKey, (err, user) => {
          if (err) {
              return res.sendStatus(403); // Forbidden
          }
          req.user = user;
          next();
      });
  } else {
      res.sendStatus(401); // Unauthorized
  }
};


// 액세스토큰 재발급 엔드포인트

app.post('/refresh_token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).send('Refresh Token is required');
  }

  try {
    // Refresh Token 검증
    jwt.verify(refreshToken, refreshsecretKey, (err, user) => {
      if (err) {
        return res.status(403).send('Invalid Refresh Token');
      }

      // 새 Access Token 생성
      console.log(user.username);
      const newAccessToken = jwt.sign({ username: user.username }, secretKey, { expiresIn: '30m' });

      res.status(200).json({ Token: newAccessToken });
    });
  } catch (error) {
    console.error('토큰 재발급 오류:', error);
    res.status(500).send('Server Error');
  }
});




// MariaDB 연결 풀 생성
function createConnectionPool() {
  return mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
  });
}






function getCurrentTime() {
  return new Date();
}





const pool = createConnectionPool(); // 전역으로 풀을 생성


// 어드민 계정 생성
async function createAdmin_b() {
let connection;
  try{
connection = await pool.getConnection();

    // Create admin user
    const adminNickname = 'admin';
    const adminPassword = process.env.ADMINPW; // You can set a stronger password
    const adminEmail = 'kor8240@gmail.com';
    
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

    const insertAdminUserQuery = `
      INSERT INTO b_user (Nickname, PW, email, BScore, LScore, Class, Lastgame)
      VALUES (?, ?, ?, 0, 0, 0, ?)
    `;
    
    // Create admin user
    await connection.query(insertAdminUserQuery, [adminNickname, hashedAdminPassword, adminEmail, todaydate]);
    console.log('Admin_b user created successfully');


}  catch (error) {
  console.error('Error creating admin:', error);
} finally {
  if (connection) {
    connection.release();  
  }
}
}

async function createAdmin_m() {
  let connection;
    try{
  connection = await pool.getConnection();
  
      // Create admin user
      const adminNickname = 'admin';
      const adminPassword = process.env.ADMINPW; // You can set a stronger password
      const adminEmail = 'kor8240@gmail.com';
      
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  
      const insertAdminUserQuery_m = `
        INSERT INTO m_user (Nickname, PW, email, BScore, LScore, Class, Lastgame)
        VALUES (?, ?, ?, 0, 0, 0, ?)
      `;
      
      // Create admin user
      await connection.query(insertAdminUserQuery_m, [adminNickname + "_m", hashedAdminPassword, adminEmail, todaydate]);
      console.log('Admin_m user created successfully');
  
  }  catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    if (connection) {
      connection.release();  
    }
  }
  }
  


// // 테이블 생성 함수
// async function createTables() {
//   let connection;
//   try {
//     connection = await pool.getConnection();

//     // b_user 테이블 생성
//     const createUserTableQuery = `
//       CREATE TABLE IF NOT EXISTS b_user (
//         Nickname VARCHAR(255) PRIMARY KEY,
//         PW VARCHAR(255),
//         email VARCHAR(255),
//         BScore FLOAT,
//         LScore FLOAT NOT NULL,
//         Class INT,
//         Lastgame DATE
//       )
//     `;
//     await connection.query(createUserTableQuery);
//     console.log('b_user Table created successfully');

//     // b_record 테이블 생성
//     const createRecordTableQuery = `
//       CREATE TABLE IF NOT EXISTS b_record (
//         OrderNum INT AUTO_INCREMENT PRIMARY KEY,
//         Date DATE,
//         Winner VARCHAR(255),
//         Loser VARCHAR(255),
//         Win2 VARCHAR(255),
//         Win3 VARCHAR(255),
//         Win4 VARCHAR(255),
//         Lose2 VARCHAR(255),
//         Lose3 VARCHAR(255),
//         Lose4 VARCHAR(255),
//         WScore INT,
//         LScore INT,
//         AddScore FLOAT
//       )
//     `;
//     await connection.query(createRecordTableQuery);
//     console.log('b_record Table created successfully');

//     // b_temp 테이블 생성
//     const createTempTableQuery = `
//       CREATE TABLE IF NOT EXISTS b_temp (
//         OrderNum INT AUTO_INCREMENT PRIMARY KEY,
//         Date DATE,
//         Winner VARCHAR(255),
//         Loser VARCHAR(255),
//         Win2 VARCHAR(255),
//         Win3 VARCHAR(255),
//         Win4 VARCHAR(255),
//         Lose2 VARCHAR(255),
//         Lose3 VARCHAR(255),
//         Lose4 VARCHAR(255),
//         WScore INT,
//         LScore INT,
//         Checked INT
//       )
//     `;
//     await connection.query(createTempTableQuery);
//     console.log('b_temp Table created successfully');

//     // m_user 테이블 생성
//     const createUserTableQuery_m = `
//       CREATE TABLE IF NOT EXISTS m_user (
//         Nickname VARCHAR(255) PRIMARY KEY,
//         PW VARCHAR(255),
//         email VARCHAR(255),
//         BScore FLOAT,
//         LScore FLOAT NOT NULL,
//         Class INT,
//         Lastgame DATE
//       )
//     `;
//     await connection.query(createUserTableQuery_m);
//     console.log('m_user Table created successfully');

//     // m_record 테이블 생성
//     const createRecordTableQuery_m = `
//       CREATE TABLE IF NOT EXISTS m_record (
//         OrderNum INT AUTO_INCREMENT PRIMARY KEY,
//         Date DATE,
//         Winner VARCHAR(255),
//         Loser VARCHAR(255),
//         Win2 VARCHAR(255),
//         Win3 VARCHAR(255),
//         Win4 VARCHAR(255),
//         Lose2 VARCHAR(255),
//         Lose3 VARCHAR(255),
//         Lose4 VARCHAR(255),
//         WScore INT,
//         LScore INT,
//         AddScore FLOAT
//       )
//     `;
//     await connection.query(createRecordTableQuery_m);
//     console.log('m_record Table created successfully');

//     // m_temp 테이블 생성
//     const createTempTableQuery_m = `
//       CREATE TABLE IF NOT EXISTS m_temp (
//         OrderNum INT AUTO_INCREMENT PRIMARY KEY,
//         Date DATE,
//         Winner VARCHAR(255),
//         Loser VARCHAR(255),
//         Win2 VARCHAR(255),
//         Win3 VARCHAR(255),
//         Win4 VARCHAR(255),
//         Lose2 VARCHAR(255),
//         Lose3 VARCHAR(255),
//         Lose4 VARCHAR(255),
//         WScore INT,
//         LScore INT,
//         Checked INT
//       )
//     `;
//     await connection.query(createTempTableQuery_m);
//     console.log('m_temp Table created successfully');

//     // bet_info 테이블 생성
//     const createbet_infoTableQuery = `
//     CREATE TABLE IF NOT EXISTS bet_info (
//       nicknamelist VARCHAR(255) PRIMARY KEY,
//       place VARCHAR(255),
//       endtime DATETIME
//       )
//     `;
//     await connection.query(createbet_infoTableQuery);
//     console.log('bet_info Table created successfully');

//     // b_betting 테이블 생성
//     const createb_bettingTableQuery = `
//       CREATE TABLE IF NOT EXISTS b_betting (
//         nickname VARCHAR(255) PRIMARY KEY,
//         betnickname VARCHAR(255) NOT NULL,
//         point INT NOT NULL
//       )
//     `;
//     await connection.query(createb_bettingTableQuery);
//     console.log('b_betting Table created successfully');

//     // m_betting 테이블 생성
//     const createm_bettingTableQuery = `
//       CREATE TABLE IF NOT EXISTS m_betting (
//         nickname VARCHAR(255) PRIMARY KEY,
//         betnickname VARCHAR(255) NOT NULL,
//         point INT NOT NULL
//       )
//     `;

//     await connection.query(createm_bettingTableQuery);
//     console.log('m_betting Table created successfully');

//     // b_oldrecord 테이블 생성
//     const createb_oldrecordTableQuery = `
//       CREATE TABLE IF NOT EXISTS b_oldrecord (
//         OrderNum INT AUTO_INCREMENT PRIMARY KEY,
//         Month DATE NOT NULL,
//         Nickname VARCHAR(255) NOT NULL,
//         BScore FLOAT NOT NULL,
//         LScore FLOAT NOT NULL,
//         CLASS INT
//       )
//     `;

//     await connection.query(createb_oldrecordTableQuery);
//     console.log('b_oldrecord Table created successfully');


//     // m_oldrecord 테이블 생성
//     const createm_oldrecordTableQuery = `
//       CREATE TABLE IF NOT EXISTS m_oldrecord (
//         OrderNum INT AUTO_INCREMENT PRIMARY KEY,
//         Month DATE NOT NULL,
//         Nickname VARCHAR(255) NOT NULL,
//         BScore FLOAT NOT NULL,
//         LScore FLOAT NOT NULL,
//         CLASS INT
//       )
//     `;

//     await connection.query(createm_oldrecordTableQuery);
//     console.log('m_oldrecord Table created successfully');

//     // b_oldtournament 테이블 생성
//     const createb_oldtournQuery = `
//       CREATE TABLE IF NOT EXISTS b_oldtournament (
//         OrderNum INT AUTO_INCREMENT PRIMARY KEY,
//         eventname VARCHAR(255) NOT NULL,
//         Championship VARCHAR(255) NOT NULL,
//         Runner_up VARCHAR(255),
//         Place3rd VARCHAR(255),
//         numberteams INT NOT NULL
//       )
//     `;

//     await connection.query(createb_oldtournQuery);
//     console.log('b_oldtournament Table created successfully');

//     // b_oldhistory 테이블 생성
//     const createb_oldhistoryQuery = `
//     CREATE TABLE IF NOT EXISTS b_oldhistory (
//       OrderNum INT AUTO_INCREMENT PRIMARY KEY,
//       Date DATE,
//       Winner VARCHAR(255),
//       Loser VARCHAR(255),
//       Win2 VARCHAR(255),
//       Win3 VARCHAR(255),
//       Win4 VARCHAR(255),
//       Lose2 VARCHAR(255),
//       Lose3 VARCHAR(255),
//       Lose4 VARCHAR(255),
//       WScore INT,
//       LScore INT
//     )
//   `;

//     await connection.query(createb_oldhistoryQuery);
//     console.log('b_oldhistory Table created successfully');


    
//     // m_oldtournament 테이블 생성
//     const createm_oldtournQuery = `
//       CREATE TABLE IF NOT EXISTS m_oldtournament (
//         OrderNum INT AUTO_INCREMENT PRIMARY KEY,
//         eventname VARCHAR(255) NOT NULL,
//         Championship VARCHAR(255) NOT NULL,
//         Runner_up VARCHAR(255),
//         Place3rd VARCHAR(255),
//         numberteams INT NOT NULL
//       )
//     `;

//     await connection.query(createm_oldtournQuery);
//     console.log('m_oldtournament Table created successfully');

//     // m_oldhistory 테이블 생성
//     const createm_oldhistoryQuery = `
//     CREATE TABLE IF NOT EXISTS m_oldhistory (
//       OrderNum INT AUTO_INCREMENT PRIMARY KEY,
//       Date DATE,
//       Winner VARCHAR(255),
//       Loser VARCHAR(255),
//       Win2 VARCHAR(255),
//       Win3 VARCHAR(255),
//       Win4 VARCHAR(255),
//       Lose2 VARCHAR(255),
//       Lose3 VARCHAR(255),
//       Lose4 VARCHAR(255),
//       WScore INT,
//       LScore INT
//     )
//   `;

//     await connection.query(createm_oldhistoryQuery);
//     console.log('m_oldhistory Table created successfully');




//     // b_eventrecordTable 테이블 생성
//     const createb_eventrecordTableQuery = `
//       CREATE TABLE IF NOT EXISTS b_eventrecord (
//         OrderNum INT AUTO_INCREMENT PRIMARY KEY,
//         eventname VARCHAR(255) UNIQUE NOT NULL,
//         Championship1 VARCHAR(255) NOT NULL,
//         Championship2 VARCHAR(255),
//         Championship3 VARCHAR(255),
//         Championship4 VARCHAR(255),
//         Runner_up1 VARCHAR(255),
//         Runner_up2 VARCHAR(255),
//         Runner_up3 VARCHAR(255),
//         Runner_up4 VARCHAR(255),
//         Place3rd1 VARCHAR(255),
//         Place3rd2 VARCHAR(255),
//         Place3rd3 VARCHAR(255),
//         Place3rd4 VARCHAR(255),
//         Semifinalist1 VARCHAR(255),
//         Semifinalist2 VARCHAR(255),
//         Semifinalist3 VARCHAR(255),
//         Semifinalist4 VARCHAR(255),
//         Quarterfinalist1 VARCHAR(255),
//         Quarterfinalist2 VARCHAR(255),
//         Quarterfinalist3 VARCHAR(255),
//         Quarterfinalist4 VARCHAR(255),
//         Quarterfinalist5 VARCHAR(255),
//         Quarterfinalist6 VARCHAR(255),
//         Quarterfinalist7 VARCHAR(255),
//         Quarterfinalist8 VARCHAR(255),
//         Quarterfinalist9 VARCHAR(255),
//         Quarterfinalist10 VARCHAR(255),
//         Quarterfinalist11 VARCHAR(255),
//         Quarterfinalist12 VARCHAR(255),
//         Quarterfinalist13 VARCHAR(255),
//         Quarterfinalist14 VARCHAR(255),
//         Quarterfinalist15 VARCHAR(255),
//         Quarterfinalist16 VARCHAR(255),
//         teamSize INT NOT NULL,
//         numberteams INT NOT NULL,
//         accept INT NOT NULL
//       )
//     `;

//     await connection.query(createb_eventrecordTableQuery);
//     console.log('b_eventrecord Table created successfully');


//     // b_calendar 테이블 생성
//     const createb_calendar = `
//       CREATE TABLE IF NOT EXISTS b_calendar (
//         yearmonth VARCHAR(255),
//         yearmonthdate VARCHAR(255) PRIMARY KEY,
//         date INT,
//         text VARCHAR(255)
//         )
//     `;

//     await connection.query(createb_calendar);
//     console.log('b_calendar Table created successfully');

//     // m_calendar 테이블 생성
//     const createm_calendar = `
//       CREATE TABLE IF NOT EXISTS m_calendar (
//         yearmonth VARCHAR(255),
//         yearmonthdate VARCHAR(255) PRIMARY KEY,
//         date INT,
//         text VARCHAR(255)
//         )
//     `;

//     await connection.query(createm_calendar);
//     console.log('m_calendar Table created successfully');



    
//     // m_eventrecordTable 테이블 생성
//     const createm_eventrecordTableQuery = `
//       CREATE TABLE IF NOT EXISTS m_eventrecord (
//         OrderNum INT AUTO_INCREMENT PRIMARY KEY,
//         eventname VARCHAR(255) UNIQUE NOT NULL,
//         Championship1 VARCHAR(255) NOT NULL,
//         Championship2 VARCHAR(255),
//         Championship3 VARCHAR(255),
//         Championship4 VARCHAR(255),
//         Runner_up1 VARCHAR(255),
//         Runner_up2 VARCHAR(255),
//         Runner_up3 VARCHAR(255),
//         Runner_up4 VARCHAR(255),
//         Place3rd1 VARCHAR(255),
//         Place3rd2 VARCHAR(255),
//         Place3rd3 VARCHAR(255),
//         Place3rd4 VARCHAR(255),
//         Semifinalist1 VARCHAR(255),
//         Semifinalist2 VARCHAR(255),
//         Semifinalist3 VARCHAR(255),
//         Semifinalist4 VARCHAR(255),
//         Quarterfinalist1 VARCHAR(255),
//         Quarterfinalist2 VARCHAR(255),
//         Quarterfinalist3 VARCHAR(255),
//         Quarterfinalist4 VARCHAR(255),
//         Quarterfinalist5 VARCHAR(255),
//         Quarterfinalist6 VARCHAR(255),
//         Quarterfinalist7 VARCHAR(255),
//         Quarterfinalist8 VARCHAR(255),
//         Quarterfinalist9 VARCHAR(255),
//         Quarterfinalist10 VARCHAR(255),
//         Quarterfinalist11 VARCHAR(255),
//         Quarterfinalist12 VARCHAR(255),
//         Quarterfinalist13 VARCHAR(255),
//         Quarterfinalist14 VARCHAR(255),
//         Quarterfinalist15 VARCHAR(255),
//         Quarterfinalist16 VARCHAR(255),
//         teamSize INT NOT NULL,
//         numberteams INT NOT NULL,
//         accept INT NOT NULL
//       )
//     `;

//     await connection.query(createm_eventrecordTableQuery);
//     console.log('m_eventrecord Table created successfully');

//     // b_posts 테이블 생성
//     const createb_postsTableQuery = `
//       CREATE TABLE IF NOT EXISTS b_posts (
//         post_id INT AUTO_INCREMENT PRIMARY KEY,
//         title VARCHAR(255) NOT NULL,
//         content TEXT NOT NULL,
//         Nickname VARCHAR(255) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         views INT DEFAULT 0,
//         comments_count INT DEFAULT 0,
//           )
//     `;

//     await connection.query(createb_postsTableQuery);
//     console.log('b_posts Table created successfully');
    
//     // b_comments 테이블 생성
//     const createb_commentsTableQuery = `
//       CREATE TABLE IF NOT EXISTS b_comments (
//         comment_id INT AUTO_INCREMENT PRIMARY KEY,
//         post_id INT NOT NULL,
//         Nickname VARCHAR(255) NOT NULL,
//         content TINYTEXT NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (post_id) REFERENCES b_posts(post_id),
//                   )
//     `;

//     await connection.query(createb_commentsTableQuery);
//     console.log('b_comments Table created successfully');


//     // m_posts 테이블 생성
//     const createm_postsTableQuery = `
//       CREATE TABLE IF NOT EXISTS m_posts (
//         post_id INT AUTO_INCREMENT PRIMARY KEY,
//         title VARCHAR(255) NOT NULL,
//         content TEXT NOT NULL,
//         Nickname VARCHAR(255) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         views INT DEFAULT 0,
//         comments_count INT DEFAULT 0,
//           )
//     `;

//     await connection.query(createm_postsTableQuery);
//     console.log('m_posts Table created successfully');
    
//     // m_comments 테이블 생성
//     const createm_commentsTableQuery = `
//       CREATE TABLE IF NOT EXISTS m_comments (
//         comment_id INT AUTO_INCREMENT PRIMARY KEY,
//         post_id INT NOT NULL,
//         Nickname VARCHAR(255) NOT NULL,
//         content TINYTEXT NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (post_id) REFERENCES b_posts(post_id),
//                   )
//     `;

//     await connection.query(createm_commentsTableQuery);
//     console.log('m_comments Table created successfully');

//   } catch (error) {
//     console.error('Error creating tables:', error);
//   } finally {
//     if (connection) {
//       connection.release();  
//     }
//   }
// }



// 새로운 엔드포인트 추가: POST /process_login
app.post('/process_login',  async (req, res) => {
  const { nickname, password } = req.body;

  // MariaDB 연결 풀에서 연결 가져오기
  const connection = await pool.getConnection(); // 기존 풀에서 연결 가져오기

  try {
    // 입력 받은 닉네임을 소문자로 변환
    const lowerCaseNickname = nickname.toLowerCase();

    // 해당 닉네임의 사용자 정보를 데이터베이스에서 조회
    const result = await connection.query(
      'SELECT * FROM b_user WHERE Nickname = ?',
      [lowerCaseNickname]
    );

    if (result.length === 0) {
      // 사용자가 존재하지 않을 경우
      res.status(401).send('There is no ID in DB');
      return;
    }

    // 비밀번호 검증
    const hashedPassword = result[0].PW;
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    if (isPasswordValid) {
      // 로그인 성공, JWT 토큰 생성
      const token = jwt.sign({ username: lowerCaseNickname }, secretKey, { expiresIn: '30m' });
      const refreshToken = jwt.sign({ username: lowerCaseNickname }, refreshsecretKey, { expiresIn: '7d' });

      res.status(200).json({ token, refreshToken }); // JSON 응답으로 변경

  } else {
      // 비밀번호 불일치
      res.status(401).send('Password is Uncorrected');
    }
  } catch (error) {
    console.error('데이터베이스 오류:', error);
    res.status(500).send('Server Error');
  } finally {
    // 연결 반환 대신에 release만 호출
    connection.release();
  }
});




// 새로운 엔드포인트 추가: POST /process_login
app.post('/process_login_m',  async (req, res) => {
  const { nickname, password } = req.body;

  // MariaDB 연결 풀에서 연결 가져오기
  const connection = await pool.getConnection(); // 기존 풀에서 연결 가져오기

  try {
    // 입력 받은 닉네임을 소문자로 변환
    const lowerCaseNickname = nickname.toLowerCase()+"_m";

    // 해당 닉네임의 사용자 정보를 데이터베이스에서 조회
    const result = await connection.query(
      'SELECT * FROM m_user WHERE Nickname = ?',
      [lowerCaseNickname]
    );

    if (result.length === 0) {
      // 사용자가 존재하지 않을 경우
      res.status(401).send('There is no ID in DB');
      return;
    }

    // 비밀번호 검증
    const hashedPassword = result[0].PW;
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    if (isPasswordValid) {
      // 로그인 성공, JWT 토큰 생성
      const token = jwt.sign({ username: lowerCaseNickname }, secretKey, { expiresIn: '30m' });
      res.status(200).json({ token }); // JSON 응답으로 변경

  } else {
      // 비밀번호 불일치
      res.status(401).send('Password is Uncorrected');
    }
  } catch (error) {
    console.error('데이터베이스 오류:', error);
    res.status(500).send('Server Error');
  } finally {
    // 연결 반환 대신에 release만 호출
    connection.release();
  }
});





// createTables();
// createAdmin_b();
// createAdmin_m();



// 회원가입 엔드포인트
app.post('/process_regi',  async (req, res) => {

  const { nickname, password, email, wgrade } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const currentDate = moment().utcOffset('+0900').format('YYYY-MM-DD HH:mm:ss');

    // 기존에 생성한 전역 풀을 사용
    const connection = await pool.getConnection();

    // 닉네임을 소문자로 변환
    const lowerCaseNickname = nickname.toLowerCase();

    const result = await connection.query(
      'INSERT INTO b_user (Nickname, PW, email, BScore, LScore, Class, Lastgame) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [lowerCaseNickname, hashedPassword, email, startscore, 0, wgrade, currentDate]
    );

    // 연결 반환 대신에 release만 호출
    connection.release();
    console.log(lowerCaseNickname + 'babapk 계정 등록');

    res.json({ success: true, message: '회원가입이 완료되었습니다.' });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


// 회원가입 엔드포인트
app.post('/process_regi_m',  async (req, res) => {
  const { nickname, password, email, wgrade } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const currentDate = moment().utcOffset('+0900').format('YYYY-MM-DD HH:mm:ss');

    // 기존에 생성한 전역 풀을 사용
    const connection = await pool.getConnection();

    // 닉네임을 소문자로 변환
    const lowerCaseNickname = nickname.toLowerCase()+ '_m';

    const result = await connection.query(
      'INSERT INTO m_user (Nickname, PW, email, BScore, LScore, Class, Lastgame) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [lowerCaseNickname, hashedPassword, email, startscore_b, 0, wgrade, currentDate]
    );

    // 연결 반환 대신에 release만 호출
    connection.release();
    console.log(lowerCaseNickname + 'mpk 계정 등록');

    res.json({ success: true, message: '회원가입이 완료되었습니다.' });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});



// 클라이언트에서 보낸 닉네임 중복 확인 요청을 처리
app.post('/check-nickname',  isAuthenticated, async (req, res) => {
  const requestedNickname = req.body.nickname;

  if (!requestedNickname) {
    res.json({ isNameAvailable: false });
    return;
  }

  let connection;
  try {
    // 기존에 생성한 전역 풀을 사용
    connection = await pool.getConnection();

    const result = await connection.query(
      `SELECT COUNT(*) AS count FROM b_user WHERE Nickname = ?`,
      [requestedNickname]
    );

    const isNameAvailable = result[0].count === 0n;
    res.json({ isNameAvailable });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      connection.end();
    }
  }
});


// 클라이언트에서 보낸 닉네임 중복 확인 요청을 처리
app.post('/check-nickname_m',  isAuthenticated, async (req, res) => {
  const requestedNickname = req.body.nickname + '_m';

  if (!requestedNickname) {
    res.json({ isNameAvailable: false });
    return;
  }

  let connection;
  try {
    // 기존에 생성한 전역 풀을 사용
    connection = await pool.getConnection();

    const result = await connection.query(
      `SELECT COUNT(*) AS count FROM m_user WHERE Nickname = ?`,
      [requestedNickname]
    );

    const isNameAvailable = result[0].count === 0n;
    res.json({ isNameAvailable });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      connection.end();
    }
  }
});










// 서버 루트 엔드포인트
app.get('/rankdata', async (req, res) => {
  try {
    // 기존에 생성한 전역 풀을 사용
    const connection = await pool.getConnection();


    // b_user 테이블에서 데이터 가져오기
    const rankdb = await connection.query('SELECT Nickname, BScore, LScore, Class, Lastgame, Records FROM b_user WHERE Nickname != "admin" ORDER BY (BScore + (LScore * 0.3) + if(Records > 15, 15, Records) * ?) DESC', [RecordScore]);
    

    // b_record 테이블에서 닉네임이 몇 번 나왔는지 세는 쿼리문
    const winCountQuery = `
    SELECT
    bu.Nickname,
    COALESCE(SUM(CASE WHEN bu.Nickname IN (br.Winner, br.win2, br.win3, br.win4) THEN 1 ELSE 0 END), 0) AS TotalWins
FROM
    b_user bu
LEFT JOIN
    b_record br ON bu.Nickname IN (br.Winner, br.win2, br.win3, br.win4)
GROUP BY
    bu.Nickname;

    `;

    const loseCountQuery = `
    SELECT
    bu.Nickname,
    COALESCE(SUM(CASE WHEN bu.Nickname IN (br.Loser, br.lose2, br.lose3, br.lose4) THEN 1 ELSE 0 END), 0) AS TotalLoses
FROM
    b_user bu
LEFT JOIN
    b_record br ON bu.Nickname IN (br.Loser, br.lose2, br.lose3, br.lose4)
GROUP BY
    bu.Nickname;
    `;

    const [recordWin, recordLose] = await Promise.all([
      connection.query(winCountQuery),
      connection.query(loseCountQuery)
    ]);


    let result = [];

    function createResultArray(rankdb, recordWin, recordLose) {
      // rankdb 배열을 순회하며 각 열의 값을 계산하고 result에 추가
      rankdb.forEach((user, index) => {
        const row = [];

        // 1. 순위 (데이터베이스에서 이미 정렬된 순서로 받았기 때문에 그대로 사용)
        row.push(index + 1);

        // 2. DB의 Nickname 값
        row.push(user.Nickname);

        // 3. DB의 Class
        row.push(user.Class);

        // 4. BScore + LScore + RecordScore
        const totalScore = Math.round((user.BScore + (user.LScore * 0.3) ) * 100) / 100 + ( (user.Records > 15 ? 15 : user.Records) * RecordScore);
        row.push(totalScore);

        // 5. DB의 BScore
        row.push(user.BScore);

        // 6. DB의 LScore
        row.push(user.LScore);

        // 7. recordWin에서 Nickname에 해당하는 숫자, 없으면 0
        const wins = Number(recordWin.find(record => record.Nickname === user.Nickname)?.TotalWins) || 0;
        row.push(wins);

        // 8. recordLose에서 Nickname에 해당하는 숫자, 없으면 0
        const losses = Number(recordLose.find(record => record.Nickname === user.Nickname)?.TotalLoses) || 0;
        row.push(losses);

        // 9. DB의 Lastgame
        const LastgameDate = user.Lastgame.toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric'});

        row.push(LastgameDate);
        // 생성된 행을 result에 추가
        result.push(row);
      });
    }
    // createResultArray 함수 호출
    createResultArray(rankdb, recordWin, recordLose);



    // 연결 반환
    connection.release();

    // 클라이언트에 데이터 응답
    res.json(result);
  } catch (error) {
    console.error('데이터베이스 오류:', error);
    res.status(500).json({ error: 'DB Error' });
  }
});



// 서버 루트 엔드포인트
app.get('/rankdata_m', async (req, res) => {
  try {
    // 기존에 생성한 전역 풀을 사용
    const connection = await pool.getConnection();


    // m_user 테이블에서 데이터 가져오기
    const rankdb = await connection.query('SELECT Nickname, BScore, LScore, Class, Lastgame FROM m_user WHERE Nickname != "admin_m" ORDER BY (BScore + LScore) DESC');
    

    // m_record 테이블에서 닉네임이 몇 번 나왔는지 세는 쿼리문
    const winCountQuery = `
      SELECT Winner AS Nickname, COUNT(*) AS WinCount FROM m_record WHERE Winner != "admin_m" GROUP BY Winner
      UNION
      SELECT win2 AS Nickname, COUNT(*) AS WinCount FROM m_record WHERE win2 != "admin_m" GROUP BY win2
      UNION
      SELECT win3 AS Nickname, COUNT(*) AS WinCount FROM m_record WHERE win3 != "admin_m" GROUP BY win3
      UNION
      SELECT win4 AS Nickname, COUNT(*) AS WinCount FROM m_record WHERE win4 != "admin_m" GROUP BY win4
    `;

    const loseCountQuery = `
      SELECT Loser AS Nickname, COUNT(*) AS LoseCount FROM m_record WHERE Loser != "admin_m" GROUP BY Loser
      UNION
      SELECT lose2 AS Nickname, COUNT(*) AS LoseCount FROM m_record WHERE lose2 != "admin_m" GROUP BY lose2
      UNION
      SELECT lose3 AS Nickname, COUNT(*) AS LoseCount FROM m_record WHERE lose3 != "admin_m" GROUP BY lose3
      UNION
      SELECT lose4 AS Nickname, COUNT(*) AS LoseCount FROM m_record WHERE lose4 != "admin_m" GROUP BY lose4
    `;

    const [recordWin, recordLose] = await Promise.all([
      connection.query(winCountQuery),
      connection.query(loseCountQuery)
    ]);


    let result = [];

    function createResultArray(rankdb, recordWin, recordLose) {
      // rankdb 배열을 순회하며 각 열의 값을 계산하고 result에 추가
      rankdb.forEach((user, index) => {
        const row = [];

        // 1. 순위 (데이터베이스에서 이미 정렬된 순서로 받았기 때문에 그대로 사용)
        row.push(index + 1);

        // 2. DB의 Nickname 값
        row.push(user.Nickname);

        // 3. DB의 Class
        row.push(user.Class);

        // 4. BScore + LScore
        const totalScore = Math.round((user.BScore + user.LScore) * 100) / 100;
        row.push(totalScore);

        // 5. DB의 BScore
        row.push(user.BScore);

        // 6. DB의 LScore
        row.push(user.LScore);

        // 7. recordWin에서 Nickname에 해당하는 숫자, 없으면 0
        const wins = Number(recordWin.find(record => record.Nickname === user.Nickname)?.WinCount) || 0;
        row.push(wins);

        // 8. recordLose에서 Nickname에 해당하는 숫자, 없으면 0
        const losses = Number(recordLose.find(record => record.Nickname === user.Nickname)?.LoseCount) || 0;
        row.push(losses);

        
        // 9. DB의 Lastgame
        const LastgameDate = user.Lastgame.toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric'});


        row.push(LastgameDate);
        // 생성된 행을 result에 추가

        // 생성된 행을 result에 추가
        result.push(row);
      });
    }

    // createResultArray 함수 호출
    createResultArray(rankdb, recordWin, recordLose);

    // 연결 반환
    connection.release();

    // 클라이언트에 데이터 응답
    res.json(result);
  } catch (error) {
    console.error('데이터베이스 오류:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});






// 서버에서 Nickname 목록을 가져오는 엔드포인트
app.get('/api/getNicknames', async (req, res) => {
  try {
    // 기존에 생성한 전역 풀을 사용
    const connection = await pool.getConnection();
    const rows = await connection.query('SELECT Nickname FROM b_user WHERE Nickname != "admin"');
    connection.release();

    // Nickname 목록만 추출하여 응답
    const nicknames = rows.map((row) => row.Nickname);
    res.json(nicknames);
  } catch (error) {
    console.error('데이터베이스 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});



// 서버에서 Nickname 목록을 가져오는 엔드포인트
app.get('/api/getNicknames_m', async (req, res) => {
  try {
    // 기존에 생성한 전역 풀을 사용
    const connection = await pool.getConnection();
    const rows = await connection.query('SELECT Nickname FROM m_user WHERE Nickname != "admin_m"');
    connection.release();

    // Nickname 목록만 추출하여 응답
    const nicknames = rows.map((row) => row.Nickname);
    res.json(nicknames);
  } catch (error) {
    console.error('데이터베이스 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});



// 미승인 기록 보내기
app.post('/submitrecord',  isAuthenticated, async (req, res) => {
    try {
        // 패자의 점수가 올바르지 않은 경우 에러 처리
        const Loserpoint = parseInt(req.body.myScore)
        if (Loserpoint < 0 || Loserpoint >= req.body.winnerScore) {
            throw new Error('패자의 점수가 올바르지 않습니다');
        }

        // 기존에 생성한 전역 풀을 사용
        const conn = await pool.getConnection();
        app.use(express.json());

        // 현재 날짜 구하기
        const currentDate = moment().utcOffset('+0900').format('YYYY-MM-DD HH:mm:ss');
        const token = req.header('Authorization')?.split(' ')[1];

        let userNickname
        if (token) {
          jwt.verify(token, secretKey, (err, decoded) => {
              if (err) {
                  return res.sendStatus(403); // Forbidden
              }
 userNickname = decoded.username})
  
        // 데이터 삽입 쿼리
        const query = `
          INSERT INTO b_temp (Date, Winner, Loser, Win2, Win3, Win4, Lose2, Lose3, Lose4, WScore, LScore, Checked)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;

        // OrderNum은 AUTO_INCREMENT로 자동 증가하므로 따로 명시하지 않음
        // Checked에는 0을 넣어줌


        const values = [
          currentDate,
            req.body.winner,
            userNickname, // 사용자의 닉네임을 Winner에 넣음
            req.body.winner2,
            req.body.winner3,
            req.body.winner4,
            req.body.loser2,
            req.body.loser3,
            req.body.loser4,
            req.body.winnerScore,
            req.body.myScore,
            0, // Checked에는 0을 넣어줌
        ];

        // 쿼리 실행
        await conn.query(query, values);
        console.log(values + 'babapk 대전기록 등록');


        // 커넥션 반환
        conn.release();
        res.status(200).json({ message: 'Send Data to Server Success' });
    }} catch (error) {
        console.error('Error adding record:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});




// 미승인 기록 보내기
app.post('/submitrecord_m',  isAuthenticated, async (req, res) => {
    try {
        // 패자의 점수가 올바르지 않은 경우 에러 처리
        const Loserpoint = parseInt(req.body.myScore)
        if (Loserpoint < 0 || Loserpoint >= req.body.winnerScore) {
            throw new Error('패자의 점수가 올바르지 않습니다');
        }

        // 기존에 생성한 전역 풀을 사용
        const conn = await pool.getConnection();

        // 현재 날짜 구하기
        const currentDate = moment().utcOffset('+0900').format('YYYY-MM-DD');

        
        const token = req.header('Authorization')?.split(' ')[1];

        let userNickname
        if (token) {
          jwt.verify(token, secretKey, (err, decoded) => {
              if (err) {
                  return res.sendStatus(403); // Forbidden
              }
 userNickname = decoded.username})}

        // 데이터 삽입 쿼리
        const query = `
          INSERT INTO m_temp (Date, Winner, Loser, Win2, Win3, Win4, Lose2, Lose3, Lose4, WScore, LScore, Checked)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;

        // OrderNum은 AUTO_INCREMENT로 자동 증가하므로 따로 명시하지 않음
        // Checked에는 0을 넣어줌


        const values = [
          currentDate,
            req.body.winner,
            userNickname, // 사용자의 닉네임을 Winner에 넣음
            req.body.winner2,
            req.body.winner3,
            req.body.winner4,
            req.body.loser2,
            req.body.loser3,
            req.body.loser4,
            req.body.winnerScore,
            req.body.myScore,
            0, // Checked에는 0을 넣어줌
        ];

        // 쿼리 실행
        await conn.query(query, values);
        console.log(values + 'mpk 대전기록 등록');

        // 커넥션 반환
        conn.release();
        res.status(200).json({ message: 'Send Data to Server Success' });
    } catch (error) {
        console.error('Error adding record:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});




// 승인 대기중인 기록 불러오기
async function fetchDataFromDatabase(NickName) {
  const connection = await pool.getConnection(); // 기존 연결 대신 풀에서 연결 가져오기

  try {
    // 여기서 쿼리를 작성해서 데이터를 불러옵니다.
    const query = `
      SELECT OrderNum, Date, Loser, Winner, Win2, Win3, Win4, Lose2, Lose3, Lose4, WScore, LScore
      FROM b_temp
      WHERE Checked = 0 AND Winner = ?;
    `;


    const results = await connection.query(query, [NickName]);

    return results;
  } catch (error) {
    console.error('Error fetching data from database:', error);
    return [];
  } finally {
    connection.release(); // 사용이 끝난 연결을 다시 풀에 반환합니다.
  }
}

// 승인 대기중인 기록 불러오기
async function fetchDataFromDatabase_m(NickName) {
  const connection = await pool.getConnection(); // 기존 연결 대신 풀에서 연결 가져오기

  try {
    // 여기서 쿼리를 작성해서 데이터를 불러옵니다.
    const query = `
      SELECT OrderNum, Date, Loser, Win2, Win3, Win4, Lose2, Lose3, Lose4, WScore, LScore
      FROM m_temp
      WHERE Checked = 0 AND Winner = ?;
    `;


    const results = await connection.query(query, [NickName]);

    return results;
  } catch (error) {
    console.error('Error fetching data from database:', error);
    return [];
  } finally {
    connection.release(); // 사용이 끝난 연결을 다시 풀에 반환합니다.
  }
}



// 승인 대기중인 기록 불러오기
app.get('/no_approved_record', isAuthenticated, async (req, res) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];

    let userNickname
    if (token) {
      jwt.verify(token, secretKey, (err, decoded) => {
          if (err) {
              return res.sendStatus(403); // Forbidden
          }
userNickname = decoded.username})}


    const data = await fetchDataFromDatabase(userNickname);
    res.json(data);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Internal Server Error');
  }
});



// 백엔드에서 데이터를 받아서 프론트에 전달
app.get('/no_approved_record_m', isAuthenticated, async (req, res) => {
  try {   
     const token = req.header('Authorization')?.split(' ')[1];

    let userNickname
    if (token) {
      jwt.verify(token, secretKey, (err, decoded) => {
          if (err) {
              return res.sendStatus(403); // Forbidden
          }
userNickname = decoded.username})}

    const data = await fetchDataFromDatabase_m(userNickname);
    res.json(data);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Internal Server Error');
  }
});




// 미승인 기록 삭제
app.post('/delete-record',  isAuthenticated, async (req, res) => {
  const orderNum = req.body.orderNum;

  if (!orderNum) {

    return res.status(400).json({ error: 'Invalid OrderNum' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const updateQuery = `
      UPDATE b_temp
      SET Checked = 1
      WHERE OrderNum = ?;
    `;

    await connection.query(updateQuery, [orderNum]);

    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error updating record in database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      connection.release(); // 연결 반환
    }
  }
});




// 미승인 기록 삭제
app.post('/delete-record_m',  isAuthenticated, async (req, res) => {
  const orderNum = req.body.orderNum;

  if (!orderNum) {

    return res.status(400).json({ error: 'Invalid OrderNum' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const updateQuery = `
      UPDATE m_temp
      SET Checked = 1
      WHERE OrderNum = ?;
    `;
    await connection.query(updateQuery, [orderNum]);

    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error updating record in database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      connection.release(); // 연결 반환
    }
  }
});




// 승인 처리
app.post('/approve-record',  isAuthenticated, async (req, res) => {
  const orderNum = req.body.orderNum;

  if (!orderNum) {
    return res.status(400).json({ error: 'Invalid OrderNum' });
  }

  const connection = await pool.getConnection();

  try {
    // b_temp 테이블에서 Checked 값을 2로 업데이트
    const updateCheckedQuery = `
      UPDATE b_temp
      SET Checked = 2
      WHERE OrderNum = ?;
    `;
    await connection.query(updateCheckedQuery, [orderNum]);

    // b_temp 테이블에서 데이터를 가져옴
    const selectQuery = `
      SELECT *
      FROM b_temp
      WHERE OrderNum = ?;
    `;
    const selectedData = await connection.query(selectQuery, [orderNum]);
    const recordData = selectedData[0];

    // b_record 테이블에 데이터 삽입
    const insertQuery = `
      INSERT INTO b_record (Date, Winner, Loser, Win2, Win3, Win4, Lose2, Lose3, Lose4, WScore, LScore)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;


    // b_user 테이블의 Lastgame 업데이트
    const lastgameUpdate = `
    UPDATE b_user
    SET Lastgame = ?
    Where Nickname = ?;
    `;
    const no_game_score_Query = `
    UPDATE b_user
    SET Records = (IF(Records = 15, 15, Records + 1 ))
    Where Nickname = ?
    `



    await connection.query(insertQuery, [
      recordData.Date,
      recordData.Winner,
      recordData.Loser,
      recordData.Win2,
      recordData.Win3,
      recordData.Win4,
      recordData.Lose2,
      recordData.Lose3,
      recordData.Lose4,
      recordData.WScore,
      recordData.LScore,
    ]);

    const winner = recordData.Winner
    const loser = recordData.Loser
    const lose2 = recordData.Lose2
    const lose3 = recordData.Lose3
    const lose4 = recordData.Lose4
    const win2 = recordData.Win2
    const win3 = recordData.Win3
    const win4 = recordData.Win4
    const wscore = recordData.WScore
    const lscore = recordData.LScore
    const date = recordData.Date


    // b_user 테이블에서 Winner의 BScore 값을 불러오기
    const winnerBScoreQuery = `
      SELECT BScore
      FROM b_user
      WHERE nickname = ?;
    `;
    const winnerBScoreResult = await connection.query(winnerBScoreQuery, [recordData.Winner]);
    let winnerBScore = winnerBScoreResult[0]?.BScore || 0;

    // 함수를 통해 BScore 값을 가져오는 로직
    const getBScore = async (nickname) => {
      if (nickname) {
        const query = `
          SELECT BScore
          FROM b_user
          WHERE nickname = ?;
        `;
        const result = await connection.query(query, [nickname]);
        return result[0]?.BScore || 0;
      } else {
        return 0;
      }
    };

    // b_user 테이블에서 win2, win3, win4의 BScore 값을 불러오기
    let win2BScore = await getBScore(recordData.Win2);
    let win3BScore = await getBScore(recordData.Win3);
    let win4BScore = await getBScore(recordData.Win4);

    // b_user 테이블에서 loser의 BScore 값을 불러오기
    let loserBScore = await getBScore(recordData.Loser);

    // b_user 테이블에서 lose2, lose3, lose4의 BScore 값을 불러오기
    let lose2BScore = await getBScore(recordData.Lose2);
    let lose3BScore = await getBScore(recordData.Lose3);
    let lose4BScore = await getBScore(recordData.Lose4);





    add_score = kvalue * (1 - (1 / (1 + 10 ** ((loserBScore - winnerBScore) / evalue))))




let currentDate = recordData.Date;
let currentDay = currentDate.getDate();
let nextMonth = new Date(currentDate);
nextMonth.setMonth(currentDate.getMonth() + 1, 1);
let lastDayOfMonth = new Date(nextMonth - 1);



subtractScore = add_score;

winnerBScore = winnerBScore + add_score
win2BScore = win2BScore + add_score
win3BScore = win3BScore + add_score
win4BScore = win4BScore + add_score

loserBScore = loserBScore - subtractScore
lose2BScore = lose2BScore - subtractScore
lose3BScore = lose3BScore - subtractScore
lose4BScore = lose4BScore - subtractScore



      // b_record 테이블에 변화값 삽입
      const changedscorerecord = `
UPDATE b_record AS t1
JOIN (
    SELECT MAX(OrderNum) AS max_order
    FROM b_record
) AS t2 ON t1.OrderNum = t2.max_order
SET t1.AddScore = ?;
`;
        
  await connection.query(changedscorerecord, [add_score]);
  console.log(`대전기록에 변화값 기록 ${add_score}`);



try {
  await connection.query(updateuserBScoreQuery, [loserBScore, loser]);
  await connection.query(lastgameUpdate, [date, loser]);
  await connection.query(no_game_score_Query, [loser]);
  console.log(`Loser의 BScore를 업데이트했습니다. 새로운 BScore: ${loserBScore}`);

} catch (error) {
  console.error('Error getting loser BScore:', error);
  // 에러 처리 로직 추가
}


try {
  await connection.query(updateuserBScoreQuery, [winnerBScore, winner]);
  await connection.query(lastgameUpdate, [date, winner]);
  await connection.query(no_game_score_Query, [winner]);
  console.log(`Winner의 WScore를 업데이트했습니다. 새로운 BScore: ${winnerBScore}`);

} catch (error) {
  console.error('Error getting winner BScore:', error);
  // 에러 처리 로직 추가
}

if (win2!=null) {
try {
  await connection.query(updateuserBScoreQuery, [lose2BScore, lose2]);
  await connection.query(lastgameUpdate, [date, lose2]);
  await connection.query(no_game_score_Query, [lose2]);
  console.log(`Loser 2의 BScore를 업데이트했습니다. 새로운 BScore: ${lose2BScore}`);

} catch (error) {
  console.error('Error getting loser BScore:', error);
  // 에러 처리 로직 추가
}

try {
  await connection.query(updateuserBScoreQuery, [win2BScore, win2]);
  await connection.query(lastgameUpdate, [date, win2]);
  await connection.query(no_game_score_Query, [win2]);

  console.log(`Winner 2의 WScore를 업데이트했습니다. 새로운 BScore: ${win2BScore}`);

} catch (error) {
  console.error('Error getting winner BScore:', error);
  // 에러 처리 로직 추가
}
}
if (win3!=null) {

try {
  await connection.query(updateuserBScoreQuery, [lose3BScore, lose3]);
  await connection.query(lastgameUpdate, [date, lose3]);
  await connection.query(no_game_score_Query, [lose3]);

  console.log(`Loser 3의 BScore를 업데이트했습니다. 새로운 BScore: ${lose3BScore}`);

} catch (error) {
  console.error('Error getting loser BScore:', error);
  // 에러 처리 로직 추가
}

try {
  await connection.query(updateuserBScoreQuery, [win3BScore, win3]);
  await connection.query(lastgameUpdate, [date, win3]);
  await connection.query(no_game_score_Query, [win3]);

  console.log(`Winner 3의 WScore를 업데이트했습니다. 새로운 BScore: ${win3BScore}`);

} catch (error) {
  console.error('Error getting winner BScore:', error);
  // 에러 처리 로직 추가
}
}

if (win4!=null) {

try {
  await connection.query(updateuserBScoreQuery, [lose4BScore, lose4]);
  await connection.query(lastgameUpdate, [date, lose4]);
  await connection.query(no_game_score_Query, [lose4]);

  console.log(`Loser 4의 BScore를 업데이트했습니다. 새로운 BScore: ${lose4BScore}`);

} catch (error) {
  console.error('Error getting loser BScore:', error);
  // 에러 처리 로직 추가
}

try {
  await connection.query(updateuserBScoreQuery, [win4BScore, win4]);
  await connection.query(lastgameUpdate, [date, win4]);
  await connection.query(no_game_score_Query, [win4]);

  console.log(`Winner 4의 WScore를 업데이트했습니다. 새로운 BScore: ${win4BScore}`);

} catch (error) {
  console.error('Error getting winner BScore:', error);
  // 에러 처리 로직 추가
}

}

await connection.commit();
res.status(200).json({ message: 'Record approved and moved to b_record successfully' });
console.log('Record approved and moved to b_record successfully')
} catch (error) {
  console.error('Error approving and moving record in database:', error);
  res.status(500).json({ error: 'Internal Server Error' });
} finally {
  connection.release();
}
});



// 승인 처리
app.post('/approve-record_m',  isAuthenticated, async (req, res) => {
  const orderNum = req.body.orderNum;

  if (!orderNum) {
    return res.status(400).json({ error: 'Invalid OrderNum' });
  }

  const connection = await pool.getConnection();

  try {
    // m_temp 테이블에서 Checked 값을 2로 업데이트
    const updateCheckedQuery = `
      UPDATE m_temp
      SET Checked = 2
      WHERE OrderNum = ?;
    `;
    await connection.query(updateCheckedQuery, [orderNum]);

    // m_temp 테이블에서 데이터를 가져옴
    const selectQuery = `
      SELECT *
      FROM m_temp
      WHERE OrderNum = ?;
    `;
    const selectedData = await connection.query(selectQuery, [orderNum]);
    const recordData = selectedData[0];

    // m_record 테이블에 데이터 삽입
    const insertQuery = `
      INSERT INTO m_record (Date, Winner, Loser, Win2, Win3, Win4, Lose2, Lose3, Lose4, WScore, LScore)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;



    await connection.query(insertQuery, [
      recordData.Date,
      recordData.Winner,
      recordData.Loser,
      recordData.Win2,
      recordData.Win3,
      recordData.Win4,
      recordData.Lose2,
      recordData.Lose3,
      recordData.Lose4,
      recordData.WScore,
      recordData.LScore,
    ]);

    const winner = recordData.Winner
    const loser = recordData.Loser
    const lose2 = recordData.Lose2
    const lose3 = recordData.Lose3
    const lose4 = recordData.Lose4
    const win2 = recordData.Win2
    const win3 = recordData.Win3
    const win4 = recordData.Win4
    const wscore = recordData.WScore
    const lscore = recordData.LScore
    



    // m_user 테이블에서 Winner의 BScore 값을 불러오기
    const winnerBScoreQuery = `
      SELECT BScore
      FROM m_user
      WHERE nickname = ?;
    `;
    const winnerBScoreResult = await connection.query(winnerBScoreQuery, [recordData.Winner]);
    let winnerBScore = winnerBScoreResult[0]?.BScore || 0;

    // 함수를 통해 BScore 값을 가져오는 로직
    const getBScore = async (nickname) => {
      if (nickname) {
        const query = `
          SELECT BScore
          FROM m_user
          WHERE nickname = ?;
        `;
        const result = await connection.query(query, [nickname]);
        return result[0]?.BScore || 0;
      } else {
        return 0;
      }
    };

    // b_user 테이블에서 win2, win3, win4의 BScore 값을 불러오기
    let win2BScore = await getBScore(recordData.Win2);
    let win3BScore = await getBScore(recordData.Win3);
    let win4BScore = await getBScore(recordData.Win4);

    // b_user 테이블에서 loser의 BScore 값을 불러오기
    let loserBScore = await getBScore(recordData.Loser);

    // b_user 테이블에서 lose2, lose3, lose4의 BScore 값을 불러오기
    let lose2BScore = await getBScore(recordData.Lose2);
    let lose3BScore = await getBScore(recordData.Lose3);
    let lose4BScore = await getBScore(recordData.Lose4);


    


winnerBScore = winnerBScore + wscore*wintimes
loserBScore = loserBScore + lscore*losetimes
win2BScore = win2BScore + wscore*wintimes
lose2BScore = lose2BScore + lscore*losetimes
win3BScore = win3BScore + wscore*wintimes
lose3BScore = lose3BScore + lscore*losetimes
win4BScore = win4BScore + wscore*wintimes
lose4BScore = lose4BScore + lscore*losetimes




try {
  await connection.query(changedscorerecord, [lscore]);
  console.log(`대전기록에 변화값 기록 ${lscore}`);

} catch (error) {
  console.error('Error setting add_score:', error);
  // 에러 처리 로직 추가
}


try {
  await connection.query(updateuserBScoreQuery_m, [loserBScore, loser]);
  console.log(`Loser의 BScore를 업데이트했습니다. 새로운 BScore: ${loserBScore}`);

} catch (error) {
  console.error('Error getting loser BScore:', error);
  // 에러 처리 로직 추가
}

try {
  await connection.query(updateuserBScoreQuery_m, [lose2BScore, lose2]);
  console.log(`Lose2의 BScore를 업데이트했습니다. 새로운 BScore: ${lose2BScore}`);

} catch (error) {
  console.error('Error getting lose2 BScore:', error);
  // 에러 처리 로직 추가
}


try {
  await connection.query(updateuserBScoreQuery_m, [lose3BScore, lose3]);
  console.log(`Lose3의 BScore를 업데이트했습니다. 새로운 BScore: ${lose3BScore}`);

} catch (error) {
  console.error('Error getting lose3 BScore:', error);
  // 에러 처리 로직 추가
}


try {
  await connection.query(updateuserBScoreQuery_m, [lose4BScore, lose4]);
  console.log(`Lose4의 BScore를 업데이트했습니다. 새로운 BScore: ${lose4BScore}`);

} catch (error) {
  console.error('Error getting lose4 BScore:', error);
  // 에러 처리 로직 추가
}

try {
  await connection.query(updateuserBScoreQuery_m, [winnerBScore, winner]);
  console.log(`Winner의 WScore를 업데이트했습니다. 새로운 BScore: ${winnerBScore}`);

} catch (error) {
  console.error('Error getting winner BScore:', error);
  // 에러 처리 로직 추가
}


try {
  await connection.query(updateuserBScoreQuery_m, [win2BScore, win2]);
  console.log(`win2의 BScore를 업데이트했습니다. 새로운 BScore: ${win2BScore}`);

} catch (error) {
  console.error('Error getting win2 BScore:', error);
  // 에러 처리 로직 추가
}


try {
  await connection.query(updateuserBScoreQuery_m, [win3BScore, win3]);
  console.log(`win3의 BScore를 업데이트했습니다. 새로운 BScore: ${win3BScore}`);

} catch (error) {
  console.error('Error getting win3 BScore:', error);
  // 에러 처리 로직 추가
}


try {
  await connection.query(updateuserBScoreQuery, [win4BScore, win4]);
  console.log(`win4의 BScore를 업데이트했습니다. 새로운 BScore: ${win4BScore}`);

} catch (error) {
  console.error('Error getting win4 BScore:', error);
  // 에러 처리 로직 추가
}

res.status(200).json({ message: 'Record approved and moved to m_record successfully' });
console.log('Record approved and moved to m_record successfully')
} catch (error) {
  console.error('Error approving and moving record in database:', error);
  res.status(500).json({ error: 'Internal Server Error' });
} finally {
  connection.release();
}
});








// 서버 레코드 데이터 가져오는 엔드포인트
app.get('/recorddata', async (req, res) => {
  try {
    // 기존에 생성한 전역 풀을 사용
    const connection = await pool.getConnection();

    // b_record 테이블에서 데이터 가져오기
    const allrecord = await connection.query(`
    SELECT OrderNum, Date, Winner, win2, win3, win4, Loser, lose2, lose3, lose4, wscore, lscore
    FROM b_record
    ORDER BY OrderNum DESC;
    `);
    connection.release();

    // 날짜 형식 포맷 변경
    const formattedRecords = allrecord.map(record => {
      return {
        ...record,
        Date: new Intl.DateTimeFormat('en-US', {
          month: '2-digit',
          day: '2-digit'
        }).format(new Date(record.Date))
      };
    });

    res.json(formattedRecords);
  } catch (error) {
    console.error('기록 불러오기 실패:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});




// 서버 레코드 데이터 가져오는 엔드포인트
app.get('/recorddata_m', async (req, res) => {
  try {
    // 기존에 생성한 전역 풀을 사용
    const connection = await pool.getConnection();

    // b_record 테이블에서 데이터 가져오기
    const allrecord = await connection.query(`SELECT OrderNum, Date, Winner, win2, win3, win4, Loser, lose2, lose3, lose4, wscore, lscore
    FROM m_record
    ORDER BY OrderNum DESC;
    `);
    connection.release();

    // 날짜 형식 포맷 변경
    const formattedRecords = allrecord.map(record => {
      return {
        ...record,
        Date: new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(new Date(record.Date))
      };
    });

    res.json(formattedRecords);
  } catch (error) {
    console.error('기록 불러오기 실패:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});





// 암호 변경 엔드포인트
app.post('/process_changepw',  isAuthenticated, async (req, res) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];
    let userNickname
    if (token) {
      jwt.verify(token, secretKey, (err, decoded) => {
          if (err) {
              return res.sendStatus(403); // Forbidden
          }
userNickname = decoded.username})}


    console.log(userNickname +' 암호변경 요청 확인');

    if (!userNickname) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 프론트엔드에서 전송한 암호 데이터
    const { nowpw, newpw } = req.body;

    // 사용자의 현재 암호 확인
    const connection = await pool.getConnection();
    const result = await connection.query('SELECT pw FROM b_user WHERE Nickname = ?', [userNickname]);
    connection.release();

    if (result.length === 0) {
      console.log('해당 사용자를 찾지 못함')
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const currentPasswordHash = result[0].pw;

    // 현재 암호 검증
    const passwordMatch = await bcrypt.compare(nowpw, currentPasswordHash);

    if (!passwordMatch) {
      return res.status(401).json({ error: '현재 암호가 일치하지 않습니다.' });
    }

    // 새로운 암호 해시 생성
    const newPasswordHash = await bcrypt.hash(newpw, 10);

    // 새로운 암호로 업데이트
    const updateResult = await connection.query('UPDATE b_user SET pw = ? WHERE Nickname = ?', [newPasswordHash, userNickname]);

    console.log(userNickname + ' 암호 업데이트가 완료되었습니다.');

    if (updateResult.affectedRows === 1) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: '암호 업데이트에 실패했습니다.' });
    }
  } catch (error) {
    console.error('암호 변경 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});



// 암호 변경 엔드포인트
app.post('/process_changepw_m',  isAuthenticated, async (req, res) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];
    let userNickname
    if (token) {
      jwt.verify(token, secretKey, (err, decoded) => {
          if (err) {
              return res.sendStatus(403); // Forbidden
          }
userNickname = decoded.username})}
console.log(userNickname +' 암호변경 요청 확인');


    if (!userNickname) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 프론트엔드에서 전송한 암호 데이터
    const { nowpw, newpw } = req.body;

    // 사용자의 현재 암호 확인
    const connection = await pool.getConnection();
    const result = await connection.query('SELECT pw FROM m_user WHERE Nickname = ?', [userNickname]);
    connection.release();

    if (result.length === 0) {
      console.log('사용자를 찾지 못함')
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const currentPasswordHash = result[0].pw;

    // 현재 암호 검증
    const passwordMatch = await bcrypt.compare(nowpw, currentPasswordHash);

    if (!passwordMatch) {
      return res.status(401).json({ error: '현재 암호가 일치하지 않습니다.' });
    }

    // 새로운 암호 해시 생성
    const newPasswordHash = await bcrypt.hash(newpw, 10);

    // 새로운 암호로 업데이트
    const updateResult = await connection.query('UPDATE m_user SET pw = ? WHERE Nickname = ?', [newPasswordHash, userNickname]);
    console.log(userNickname + ' 암호 업데이트가 완료되었습니다.');

    if (updateResult.affectedRows === 1) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: '암호 업데이트에 실패했습니다.' });
    }
  } catch (error) {
    console.error('암호 변경 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});




// 임시 비밀번호 요청 엔드 포인트

app.post('/process_emailpw',  async (req, res) => {
  try {
    const { findpw_nickname, findpw_email } = req.body;
    console.log(findpw_nickname + ' 임시 암호 전송 확인 요청');

    const connection = await pool.getConnection();
    const result = await connection.query('SELECT email FROM b_user WHERE Nickname = ?', [findpw_nickname]);
    connection.release();

    if (result.length === 0) {
      console.log('사용자를 찾지 못함');
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const correctemail = result[0].email;

    if (correctemail !== findpw_email) {
      return res.status(401).json({ error: 'Email error' });
    }

    function generateRandomPassword(length) {
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let password = '';
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
      }
      return password;
    }

    const temporaryPassword = generateRandomPassword(10);
    const temporaryPasswordHash = await bcrypt.hash(temporaryPassword, 10);
    const temp_password_input = await connection.query('UPDATE b_user SET pw = ? WHERE Nickname = ?', [temporaryPasswordHash, findpw_nickname]);

    if (temp_password_input.affectedRows === 1) {
      const mailOptions = {
        from: 'kor8240@naver.com',
        to: findpw_email,
        subject: 'D2R PvP 새 암호',
        text: '임시 암호 : ' + temporaryPassword,
      };

      const nodemailer = require('nodemailer');

      let transporter = nodemailer.createTransport({
        host: 'smtp.naver.com',
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PW
              },
      });

      await transporter.sendMail(mailOptions);
      res.json({ success: true });
      
    } else {
      res.status(500).json({ error: '암호 업데이트에 실패했습니다.' });
    }
  } catch (error) {
    console.error('서버 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});




// 임시 비밀번호 요청 엔드 포인트
app.post('/process_emailpw_m',  async (req, res) => {
  try {


    // 프론트엔드에서 전송한 이메일 및 암호 데이터
    let { findpw_nickname, findpw_email } = req.body;
    findpw_nickname = findpw_nickname+'_m'
    console.log(findpw_nickname +'_m 임시 암호 전송 확인 요청');


// 사용자의 현재 이메일
const connection = await pool.getConnection();
const result = await connection.query('SELECT email FROM m_user WHERE Nickname = ?', [findpw_nickname]);
connection.release();

if (result.length === 0) {
  console.log('사용자를 찾지 못함');
  return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
}

const correctemail = result[0].pw;

// 이메일 비교

if (!correctemail==findpw_email) {
  return res.status(401).json({ error: 'Email error' });
}


    // 임시 비밀번호 발급
    function generateRandomPassword(length) {
      // 가능한 문자셋
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
      let password = '';
      for (let i = 0; i < length; i++) {
        // charset에서 무작위 문자 선택
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
      }
    
      return password;
    }
    
    // 10자리의 무작위 임시 비밀번호 생성
    const temporaryPassword = generateRandomPassword(10);
    

    // 새로운 암호 해시 생성
    const temporaryPasswordHash = await bcrypt.hash(temporaryPassword, 10);

    // 새로운 암호로 업데이트
    const temp_password_input = await connection.query('UPDATE m_user SET pw = ? WHERE Nickname = ?', [temporaryPasswordHash, findpw_nickname]);


    if (temp_password_input.affectedRows === 1) {
      const mailOptions = {
        from: 'kor8240@naver.com',
        to: findpw_email,
        subject: 'D2R PvP 임시 암호',
        text: '임시 암호 : ' + temporaryPassword,
      };

      const nodemailer = require('nodemailer');

      let transporter = nodemailer.createTransport({
        host: 'smtp.naver.com',
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PW
              },
      });

// 이메일 전송
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('이메일 전송');
  }
});
      res.json({ success: true });
    } else {
      res.status(500).json({ error: '암호 업데이트에 실패했습니다.' });
    }

      } catch (error) {
    console.error('서버 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});





// 사용자 정보를 반환하는 엔드포인트
app.get('/user_data', isAuthenticated, async (req, res) => {

  try {    const token = req.header('Authorization')?.split(' ')[1];

    let userNickname
    if (token) {
      jwt.verify(token, secretKey, (err, decoded) => {
          if (err) {
              return res.sendStatus(403); // Forbidden
          }
userNickname = decoded.username})}

    if (!userNickname) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 사용자 정보 쿼리
    const connection = await pool.getConnection();
    const userResult = await connection.query('SELECT * FROM b_user WHERE Nickname = ?', [userNickname]);

    if (userResult.length === 0) {
      connection.release();
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자 전적 쿼리
    const recordResult = await connection.query(`
      SELECT
        COUNT(*) AS countwin,
        (SELECT COUNT(*) FROM b_record WHERE Loser = ? OR lose2 = ? OR lose3 = ? OR lose4 = ?) AS countlose
      FROM b_record
      WHERE Winner = ? OR win2 = ? OR win3 = ? OR win4 = ?
    `, [userNickname, userNickname, userNickname, userNickname, userNickname, userNickname, userNickname, userNickname]);

    connection.release();

    
    // BigInt를 문자열로 변환
    const userData = {
      nickname: userNickname,
      email: userResult[0].email,
      tscore: (userResult[0].BScore + userResult[0].LScore).toString(),
      bscore: userResult[0].BScore.toString(),
      lscore: userResult[0].LScore.toString(),
      lastdate: new Date(userResult[0].Lastgame).toLocaleDateString('en-US',  { year: 'numeric', month: '2-digit', day: '2-digit' } ),
      weapon: userResult[0].Class,
      countwin: recordResult[0].countwin.toString(),
      countlose: recordResult[0].countlose.toString(),
      countrecord: (recordResult[0].countwin + recordResult[0].countlose).toString(),
    };
    
    res.json(userData);
  } catch (error) {
    console.error('사용자 정보 가져오기 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});



// 사용자 정보를 반환하는 엔드포인트
app.get('/user_data_m', isAuthenticated, async (req, res) => {

  try {
    const token = req.header('Authorization')?.split(' ')[1];

    let userNickname
    if (token) {
      jwt.verify(token, secretKey, (err, decoded) => {
          if (err) {
              return res.sendStatus(403); // Forbidden
          }
userNickname = decoded.username})}


    if (!userNickname) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 사용자 정보 쿼리
    const connection = await pool.getConnection();
    const userResult = await connection.query('SELECT * FROM m_user WHERE Nickname = ?', [userNickname]);

    if (userResult.length === 0) {
      connection.release();
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자 전적 쿼리
    const recordResult = await connection.query(`
      SELECT
        COUNT(*) AS countwin,
        (SELECT COUNT(*) FROM b_record WHERE Loser = ? OR lose2 = ? OR lose3 = ? OR lose4 = ?) AS countlose
      FROM m_record
      WHERE Winner = ? OR win2 = ? OR win3 = ? OR win4 = ?
    `, [userNickname, userNickname, userNickname, userNickname, userNickname, userNickname, userNickname, userNickname]);

    connection.release();

    
    // BigInt를 문자열로 변환
    const userData = {
      nickname: userNickname,
      email: userResult[0].email,
      tscore: (userResult[0].BScore + userResult[0].LScore).toString(),
      bscore: userResult[0].BScore.toString(),
      lscore: userResult[0].LScore.toString(),
      lastdate: new Date(userResult[0].Lastgame).toLocaleDateString('en-US',  { year: 'numeric', month: '2-digit', day: '2-digit' } ),
      weapon: userResult[0].Class,
      countwin: recordResult[0].countwin.toString(),
      countlose: recordResult[0].countlose.toString(),
      countrecord: (recordResult[0].countwin + recordResult[0].countlose).toString(),
    };
    
    res.json(userData);
  } catch (error) {
    console.error('사용자 정보 가져오기 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});









// 어드민 점수 부여 엔드포인트
app.post('/submit-admin-score',  isAuthenticated, async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];

  let userNickname
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }
userNickname = decoded.username})}



  const player = req.body.player;
  const adminscore = req.body.playerScore;



  let connection;
  try {

    if (userNickname!='admin') {

      res.status(403).json({ message: '권한이 없습니다' });
    } else{
  
    connection = await pool.getConnection();

    const updateScoreQuery = `
      UPDATE b_user
      SET LScore = LScore + ?
      WHERE Nickname = ?;
    `;
    await connection.query(updateScoreQuery, [adminscore, player]);
    console.log('관리자의 점수 직접 부여 :' + player + '에게 ' + adminscore + '점 부여')

    res.status(200).json({ message: 'Lscore update successfully' });
  } } catch (error) {
    console.error('Error updating record in database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      connection.release(); // 연결 반환
    }
  }
});



// 어드민 점수 부여 엔드포인트
app.post('/submit-admin-score_m',  isAuthenticated, async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];
  let userNickname
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }
userNickname = decoded.username})}


  const player = req.body.player;
  const adminscore = req.body.playerScore;

  if (userNickname!='admin_m') {

    return res.status(400).json({ message: '권한이 없습니다' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const updateScoreQuery = `
      UPDATE m_user
      SET LScore = LScore + ?
      WHERE Nickname = ?;
    `;
    console.log('updated')
    await connection.query(updateScoreQuery, [adminscore, player + '_m']);
    console.log('관리자의 점수 직접 부여 :' + player  + '_m 에게 ' + adminscore + '점 부여')

    res.status(200).json({ message: 'Lscore update successfully' });
  } catch (error) {
    console.error('Error updating record in database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      connection.release(); // 연결 반환
    }
  }
});








//승인된 기록 삭제하기

app.delete('/delete-row', isAuthenticated, async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];

  let userNickname
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }
userNickname = decoded.username})}


  if (userNickname!=='admin') {
     return res.status(400).json({ message: '권한이 없습니다' });   
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {

    const OrderNum = req.body.OrderNum;
    // Fetch the row data from b_record using OrderNum
    console.log('다음 기록 삭제하기 :' + OrderNum);

    const selectRecordQuery = `
      SELECT Winner, Win2, Win3, Win4, Loser, Lose2, Lose3, Lose4, AddScore, LScore
      FROM b_record
      WHERE OrderNum = ?;
    `;
    const recordRow = await connection.query(selectRecordQuery, [OrderNum]);

    if (recordRow.length === 0) {
      return res.status(404).res.json({ error: 'Row not found' });
    }

    const winnerNicknames = [recordRow[0].Winner, recordRow[0].Win2, recordRow[0].Win3, recordRow[0].Win4];
    const loserNicknames = [recordRow[0].Loser, recordRow[0].Lose2, recordRow[0].Lose3, recordRow[0].Lose4];
    const LScore = [recordRow[0].LScore]

    const updateBScoreQuery3 = `
UPDATE b_user
SET BScore = BScore - ?
WHERE Nickname IN (?, ?, ?, ?)
`;
const updateRecordsQuery = `
UPDATE b_user
SET Records = Records - 1
WHERE Nickname IN (?, ?, ?, ?)`;


add_score = recordRow[0].AddScore

subtractScore = 0 - add_score;

console.log('기록 삭제시 잃게 되는 승자 점수 :'+ add_score + ' / 기록 삭제시 얻게 되는 패자 점수 :' + subtractScore);

      // Execute the first update query within the transaction for winners
      await connection.query(updateBScoreQuery3, [
        add_score,
        ...winnerNicknames,
      ]);

      // Execute the second update query within the transaction for losers
      await connection.query(updateBScoreQuery3, [
        // Modify the calculation for losers using loser_score_percent
        subtractScore,
,        ...loserNicknames,
      ]);
        await connection.query(updateRecordsQuery, [...winnerNicknames]); 
        await connection.query(updateRecordsQuery, [...loserNicknames]); 


      // Delete the row from b_record
      const deleteRecordQuery = `
        DELETE FROM b_record
        WHERE OrderNum = ?;
      `;

      await connection.query(deleteRecordQuery, OrderNum);
      console.log('기록 삭제 완료');
      await connection.commit(); // 트랜잭션 커밋

      res.status(200).json({ message: 'Row deleted successfully' });

  } catch (error) {
    console.error('삭제 오류:', error);
    res.status(500).json({ error: 'Internal Server Error' });
    await connection.rollback();
  } finally{
    connection.release();
  }
});






//승인된 기록 삭제하기

app.delete('/delete-row_m', isAuthenticated, async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];

  let userNickname
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }
userNickname = decoded.username})}

  if (userNickname!=='admin_m') {

    return res.status(400).json({ message: '권한이 없습니다' });
  }


  try {
    const OrderNum = req.body.OrderNum;


    // Fetch the row data from m_record using OrderNum
    const connection = await pool.getConnection();
    const selectRecordQuery = `
      SELECT Winner, Win2, Win3, Win4, Loser, Lose2, Lose3, Lose4, WScore, LScore
      FROM m_record
      WHERE OrderNum = ?;
    `;
    const recordRow = await connection.query(selectRecordQuery, [OrderNum]);
    connection.release();

    if (recordRow.length === 0) {
      return res.status(404).json({ error: 'Row not found' });
    }

    // Start a transaction
    const connection2 = await pool.getConnection();
    await connection2.beginTransaction();

    try {
      const winnerNicknames = [recordRow[0].Winner, recordRow[0].Win2, recordRow[0].Win3, recordRow[0].Win4];
      const loserNicknames = [recordRow[0].Loser, recordRow[0].Lose2, recordRow[0].Lose3, recordRow[0].Lose4];
      const WScore = [recordRow[0].WScore]
      const LScore = [recordRow[0].LScore]

      const updateBScoreQuery3 = `
  UPDATE m_user
  SET BScore = BScore - ?
  WHERE Nickname IN (?, ?, ?, ?);
`;

;
      // Execute the first update query within the transaction for winners
      await connection2.query(updateBScoreQuery3, [
        WScore*wintimes,
        ...winnerNicknames,
      ]);

      // Execute the second update query within the transaction for losers
      await connection2.query(updateBScoreQuery3, [
        // Modify the calculation for losers using loser_score_percent
        LScore*losetimes,
,        ...loserNicknames,
      ]);

      // Delete the row from m_record
      const deleteRecordQuery = `
        DELETE FROM m_record
        WHERE OrderNum = ?;
      `;
      await connection2.query(deleteRecordQuery, [OrderNum]);

      // Commit the transaction
      await connection2.commit();
      connection2.release();

      res.status(200).json({ message: 'Row deleted successfully' });
    } catch (error) {
      // Rollback the transaction in case of an error
      await connection2.rollback();
      connection2.release();
      throw error;
    }

  } catch (error) {
    console.error('삭제 오류:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





// 대전 점수를 재계산하는 엔드포인트
app.post('/reset-score-endpoint',  isAuthenticated, async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];

  let userNickname
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }
userNickname = decoded.username})}

  const connection = await pool.getConnection();

  try {
    if (userNickname==="admin"){
    
    await connection.beginTransaction();


    // 계정 수, 승수 쿼리문으로 추출해 메모리에 저장
    const accountCount = await connection.query('SELECT COUNT(*) AS count FROM b_user');
    const wins = await connection.query(`
    SELECT
    bu.Nickname,
    COALESCE(SUM(CASE WHEN bu.Nickname IN (br.Winner, br.win2, br.win3, br.win4) THEN 1 ELSE 0 END), 0) AS TotalWins
FROM
    b_user bu
LEFT JOIN
    b_record br ON bu.Nickname IN (br.Winner, br.win2, br.win3, br.win4)
GROUP BY
    bu.Nickname;

    `);

    // BScore를 0으로 초기화
    await connection.query('UPDATE b_user SET BScore = 0');

    // OrderNum 처리
    await connection.query(`
      IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'b_record' AND COLUMN_NAME = 'OrderNum')
      THEN
          ALTER TABLE b_record DROP COLUMN OrderNum;
      END IF
    `);

    await connection.query('ALTER TABLE b_record ADD COLUMN IF NOT EXISTS OrderNumbackup INT AUTO_INCREMENT PRIMARY KEY');
    await connection.query('ALTER TABLE b_record CHANGE COLUMN OrderNumbackup OrderNum INT AUTO_INCREMENT');

    // 승리 횟수에 따라 점수를 기록합니다
    for (let number = 0; number < accountCount[0].count; number++) {
await connection.query('UPDATE b_user SET BScore = ? WHERE Nickname = ?',[wins[number].TotalWins * 5, wins[number].Nickname])
    }

    await connection.commit();
    res.json({ success: true, message: '대전점수가 재계산되었습니다.' });
    connection.release();
  }
  else{
res.status(403).json({error: '접근 권한이 없습니다'});

  } } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, error: 'Internal Server Error' });

  } finally{
    connection.release(); // 커넥션 릴리스

  }
  
});





// 대전 점수를 재계산하는 엔드포인트
app.post('/reset-score-endpoint_m',  isAuthenticated, async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];

  let userNickname
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }
userNickname = decoded.username})}

  
  try {

    if (userNickname==="admin_m") {
    // MariaDB 연결 풀에서 연결 가져오기
    const connection = await pool.getConnection();

    // BScore를 1000으로 업데이트
    await connection.query('UPDATE m_user SET BScore = ?',[startscore]);

    // B_record에서 winner에 해당하는 행을 찾아 BScore 업데이트
    await connection.query(`
      UPDATE m_user
      SET BScore = BScore + IFNULL(
        (SELECT SUM(WScore * ?) FROM m_record WHERE Winner = m_user.Nickname OR win2 = m_user.Nickname OR win3 = m_user.Nickname OR win4 = m_user.Nickname),
        0
      )
    `,[wintimes]);

    // B_record에서 loser에 해당하는 행을 찾아 BScore 업데이트
    await connection.query(`
      UPDATE m_user
      SET BScore = BScore + IFNULL(
        (SELECT SUM(LScore * ?) FROM m_record WHERE Loser = m_user.Nickname OR lose2 = m_user.Nickname OR lose3 = m_user.Nickname OR lose4 = m_user.Nickname),
        0
      )
    `, [losetimes]);

    // 연결 반환 대신에 release만 호출
   
    connection.release();
    console.log('대전 점수를 전체 재계산하였습니다 mpk')
    res.json({ success: true, message: '대전점수가 재계산되었습니다.' });
    }else{
      res.status(403).json({error: '접근 권한이 없습니다'});
       }} catch (error) {
    console.error('데이터베이스 오류:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


// // 승부예측 경기정보 제출하기
// app.post('/bet_info',  isAuthenticated, async (req, res) => {
// const endtime = req.body.endtime
// const gamename = req.body.gamename
// const playername = req.body.playername

//   try {
//     // MariaDB 연결 풀에서 연결 가져오기
//     const connection = await pool.getConnection();
// const new_bet_info_query = `
// INSERT INTO bet_info (endtime, place, nicknamelist)
// VALUES (?, ?, ?);
// `

// // 승부예측 경기 정보 제출하기
// await connection.query(new_bet_info_query,[endtime, gamename, playername]);


//     connection.release();
//     res.json({ success: true, message: '승자예측경기 등록 완료' });

//   } catch (error) {
//     console.error('데이터베이스 오류:', error);
//     res.status(500).json({ success: false, error: '데이터베이스가 오류입니다' });
//   }

// });


// // 승부예측 닉네임 선택지 채우기
// app.get('/filledbetNickname', isAuthenticated, async (req, res) => {
//   try {

//     const connection = await pool.getConnection();


//     // 쿼리 실행
//     const queryResult = await connection.query('SELECT nicknamelist AS label, nicknamelist AS value FROM bet_info');

//     // 연결 반환
//     connection.release();

//         // 결과를 클라이언트에 전송
//         res.json(queryResult); 
//       } catch (error) {
//     console.error('데이터 가져오기 오류:', error);
//     res.status(500).json({ error: '데이터 가져오기 오류' });
//   }
// });



// // 배팅 기록하기
// app.post('/placeBet',  isAuthenticated, async (req, res) => {
//   try {
//     // MariaDB 연결
//     const connection = await pool.getConnection();

//     // endtime 컬럼 값 가져오기
//     const endTimeQuery = 'SELECT MAX(endtime) AS endTime FROM bet_info'; // 또는 적절한 쿼리를 사용하여 endtime을 가져오세요.
//     const endTimeResult = await connection.query(endTimeQuery);
//     const targetTime =  new Date(endTimeResult[0].endTime.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
//     const currentTime = new Date(getCurrentTime().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));

//     if (currentTime < targetTime) {



//     const nickname = req.session.user.nickname;
//     const betnickname = req.body.betselect;
//     if (betnickname ===''){
// throw error

//     }
//     const point = req.body.betscore;
// const insertbetQuery = `INSERT INTO b_betting (nickname, betnickname, point) values (?, ?, ?)`

// const inputbet = await connection.query(insertbetQuery,[nickname, betnickname, point]);

// connection.release();

// res.json({ success: true});

//     }
//     else{
// res.json({success: false});

//     }

// }catch (error) {
//   console.error('데이터 가져오기 오류:', error);
//   res.status(500).json({ error: '데이터 가져오기 오류' });
// }

// });



// // 배팅 기록하기
// app.post('/placeBet_m',  isAuthenticated, async (req, res) => {
//   try {
//     // MariaDB 연결
//     const connection = await pool.getConnection();

//     // endtime 컬럼 값 가져오기
//     const endTimeQuery = 'SELECT MAX(endtime) AS endTime FROM bet_info'; // 또는 적절한 쿼리를 사용하여 endtime을 가져오세요.
//     const endTimeResult = await connection.query(endTimeQuery);
//     const targetTime = endTimeResult[0].endTime.toLocaleString('en-US', { timeZone: 'Asia/Seoul' });;
//     const currentTime = getCurrentTime().toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
//     if (currentTime < targetTime) {



//     const nickname = req.session.user.nickname;
//     const betnickname = req.body.betselect;
//     if (betnickname ===''){
// throw error

//     }
//     const point = req.body.betscore;
// const insertbetQuery = `INSERT INTO m_betting (nickname, betnickname, point) values (?, ?, ?)`

// const inputbet = await connection.query(insertbetQuery,[nickname, betnickname, point]);

// connection.release();

// res.json({ success: true});

//     }
//     else{
// res.json({success: false});

//     }

// }catch (error) {
//   console.error('데이터 가져오기 오류:', error);
//   res.status(500).json({ error: '데이터 가져오기 오류' });
// }

// });






// app.get('/loadbettingtable', async (req, res) => {
//   try {
//     const connection = await pool.getConnection();

//     // 닉네임 리스트 가져오기
//     const nicknamesQueryResult = await connection.query('SELECT nicknamelist FROM bet_info');
//     const nicknames = nicknamesQueryResult.map((row) => row.nicknamelist);

//     // 각 닉네임에 대한 포인트 합 및 전체 포인트 합 구하기
//     let totalPointsSum = 0;
//     const pointList = [];

//     for (const nickname of nicknames) {
//       const totalPointQuery = `
//         SELECT
//           (SELECT COALESCE(SUM(point), 0) FROM b_betting WHERE betnickname = ?) +
//           (SELECT COALESCE(SUM(point), 0) FROM m_betting WHERE betnickname = ?) AS totalPoint
//       `;
//       const totalPointResult = await connection.query(totalPointQuery, [nickname, nickname]);
//       const totalPoint = totalPointResult[0].totalPoint;

//       totalPointsSum += parseInt(totalPoint, 10);
//       pointList.push({ nickname, totalPoint });
//     }

// // 각 닉네임에 대한 포인트 비율 계산
// for (const pointItem of pointList) {
//   pointItem.pointRatio = totalPointsSum !== 0 ? totalPointsSum / pointItem.totalPoint + 1  : 2; // 변경된 부분
// }

//     // 결과를 클라이언트에 전송
//     res.json({ pointList, totalPointsSum });
//     connection.release();

//   } catch (error) {
//     console.error('데이터 가져오기 오류:', error);
//     res.status(500).json({ error: '데이터 가져오기 오류' });
//   }
// });



// // 승자 세팅하기

// app.post('/setwinner',  isAuthenticated, async (req, res) => {
//   const connection = await pool.getConnection();

//   try {

//     const winnernickname = req.body.selectedwinner;


// // 닉네임 리스트 가져오기
// const nicknamesQueryResult_b = await connection.query('SELECT nickname FROM b_betting');
// const nicknamesQueryResult_m = await connection.query('SELECT nickname FROM m_betting');

// // 각 결과에서 nickname만 추출
// const betternicknames_b = nicknamesQueryResult_b.map((row) => row.nickname);
// const betternicknames_m = nicknamesQueryResult_m.map((row) => row.nickname);

// // 두 배열 합치기
// const betternicknames = [...betternicknames_b, ...betternicknames_m];



// // 트랜잭션 시작
// await connection.beginTransaction();

// // 닉네임 리스트 가져오기
// const nicknamesQueryResult = await connection.query('SELECT nicknamelist FROM bet_info');



// // 각 닉네임에 대한 포인트 합 및 전체 포인트 합 구하기
// let totalPointsSum = 0;
// const pointList = [];

// for (const nicknameData of nicknamesQueryResult) {
//   const nickname = nicknameData.nicknamelist; // 각 닉네임 데이터에서 실제 닉네임 추출
//   const totalPointQuery = `
//     SELECT
//       (SELECT COALESCE(SUM(point), 0) FROM b_betting WHERE betnickname = ?) +
//       (SELECT COALESCE(SUM(point), 0) FROM m_betting WHERE betnickname = ?) AS totalPoint
//   `;
//   const totalPointResult = await connection.query(totalPointQuery, [nickname, nickname]);
//   const totalPoint = totalPointResult[0].totalPoint;


//   totalPointsSum += parseInt(totalPoint, 10);
// }



// // winnerNickname에 대한 포인트 총합 구하기
// const winnerTotalPointQuery = `
//   SELECT
//     (SELECT COALESCE(SUM(point), 0) FROM b_betting WHERE betnickname = ?) +
//     (SELECT COALESCE(SUM(point), 0) FROM m_betting WHERE betnickname = ?) AS totalPoint
// `;
// const winnerTotalPointResult = await connection.query(winnerTotalPointQuery, [winnernickname, winnernickname]);
// const winnerTotalPoint = parseInt(winnerTotalPointResult[0].totalPoint, 10);

// let winnergetpointratio;

// if (winnerTotalPoint === 0) {
//   winnergetpointratio = 0;
// } else {
//   winnergetpointratio = totalPointsSum / winnerTotalPoint + 1;
// }



// // winnerNickname에 대한 각 행에 대해 개별적으로 처리
// const winnerUpdateLScoreQuery = `
// UPDATE b_user
// SET LScore = LScore + (
//   ? * COALESCE((SELECT point FROM b_betting WHERE betnickname = ? AND nickname = ?), 0)
// )
// WHERE Nickname = ?;
// `;

// for (const betternickname of betternicknames) {
//   await connection.query(winnerUpdateLScoreQuery, [winnergetpointratio-1, winnernickname, betternickname, betternickname]);
// }

// // b_user에서 LScore 값을 갱신
// const updateLScoreQuery = `
// UPDATE b_user
// SET LScore = LScore - (COALESCE((SELECT point FROM b_betting WHERE betnickname != ? AND nickname = ?), 0)
// )
// WHERE Nickname = ?;
// `;
// for (const betternickname of betternicknames) {
//   console.log("Before Query - LScore, winnernickname, betternickname:", winnernickname, betternickname);
//   await connection.query(updateLScoreQuery, [winnernickname, betternickname, betternickname]);
//   console.log("After Query - LScore, winnernickname, betternickname:", winnernickname, betternickname);
// }




// // winnerNickname에 대한 각 행에 대해 개별적으로 처리
// const winnerUpdateLScoreQuery_m = `
// UPDATE m_user
// SET LScore = LScore + (
//   ? * COALESCE((SELECT point FROM m_betting WHERE betnickname = ? AND nickname = ?), 0)
// )
// WHERE Nickname = ?;
// `;

// for (const betternickname of betternicknames) {
//   await connection.query(winnerUpdateLScoreQuery_m, [winnergetpointratio-1, winnernickname, betternickname, betternickname]);
// }

// // m_user에서 LScore 값을 갱신
// const updateLScoreQuery_m = `
// UPDATE m_user
// SET LScore = LScore - (COALESCE((SELECT point FROM m_betting WHERE betnickname != ? AND nickname = ?), 0)
// )
// WHERE Nickname = ?;
// `;
// for (const betternickname of betternicknames) {
//   console.log("Before Query - LScore, winnernickname, betternickname:", winnernickname, betternickname);
//   await connection.query(updateLScoreQuery_m, [winnernickname, betternickname, betternickname]);
//   console.log("After Query - LScore, winnernickname, betternickname:", winnernickname, betternickname);
// }




// const deleteinfo = await connection.query('DELETE from bet_info')
// const b_betting = await connection.query('DELETE from b_betting')
// const m_betting = await connection.query('DELETE from m_betting')







//     // 트랜잭션 커밋
//     await connection.commit();

//     // 연결 반환
//     connection.release();

//     res.json({ success: true });
//   } catch (error) {
//     // 에러 발생 시 트랜잭션 롤백
//     await connection.rollback();

//     console.error('데이터 가져오기 오류:', error);
//     res.status(500).json({ error: '데이터 가져오기 오류' });
//   }
// });


// app.get('/getEndtime', async (req, res) => {
//   try {
//     // MariaDB 연결
//     const connection = await pool.getConnection();

//     // endtime 컬럼 값 가져오기
//     const endTimeQuery = 'SELECT MAX(endtime) AS endTime FROM bet_info';
//     const endTimeResult = await connection.query(endTimeQuery);
//     const endTime = endTimeResult[0].endTime;


//     const formattedEndTime = new Date(endTime);

//     const localFormattedEndTime = formattedEndTime.toLocaleString('en-US', { timeZone: 'Asia/Seoul' });

//     connection.release();

//     // 올바른 응답 전송 방법 사용
//     res.json({ endTime: localFormattedEndTime });
    
//   } catch (error) {
//     res.status(500).json({ error: '날짜 가져오기 오류' }); // 오류 응답 전송
//   }
// });


// 랭킹리셋 엔드포인트
app.post('/reset-rank',  isAuthenticated, async (req, res) => {
  const connection = await pool.getConnection();
  const token = req.header('Authorization')?.split(' ')[1];

  let userNickname
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }
userNickname = decoded.username})}

  try {
    if (userNickname==="admin") {
    await connection.beginTransaction();

  // Insert into b_oldrecord
  const insertQuery = `
    INSERT INTO b_oldrecord (Nickname, BScore, LScore, Class, Month)
    SELECT Nickname, BScore, LScore, Class, DATE_FORMAT(NOW(), '%Y-%m-01')
    FROM b_user
  `;
  await connection.query(insertQuery);

  const backuphistoryQuery = `
  INSERT INTO b_oldhistory (Date, Winner, Loser, Win2, Win3, Win4, Lose2, Lose3, Lose4, WScore, LScore)
  SELECT Date, Winner, Loser, Win2, Win3, Win4, Lose2, Lose3, Lose4, WScore, LScore
  FROM b_record
`;
await connection.query(backuphistoryQuery);

const backuptournQuery = `
INSERT INTO b_oldtournament (eventname, Championship, Runner_up, Place3rd, numberteams)
SELECT eventname, Championship1, Runner_up1, Place3rd1, numberteams
FROM b_eventrecord
WHERE teamSize = 1 AND accept = 2
`;
await connection.query(backuptournQuery);


  // 점수 초기화
  const resetBScoreQuery = `
    UPDATE b_user
    SET BScore = ? , LScore = 0, Records = 0
  `;
  await connection.query(resetBScoreQuery,[startscore]);




  // Delete from b_record
  const deleteBRecordQuery = `
    DELETE FROM b_record;
  `;
  await connection.query(deleteBRecordQuery);

  // Delete from b_temp
  const deleteBTempQuery = `
    DELETE FROM b_temp;
  `;
  await connection.query(deleteBTempQuery);

  // Delete from b_eventrecord
  const deleteBEventrecordQuery = `
  DELETE FROM b_eventrecord;
`;
await connection.query(deleteBEventrecordQuery);


// createAdmin_b(); // 어드민 계정 생성함수
await connection.commit();
res.json({ success: true });
console.log('계정 데이터를 초기화하였습니다');
} else {
  res.status(403).json({error: '권한이 없습니다'});

} } catch (error) {
await connection.rollback();
console.error('랭킹 초기화 실패', error);
res.status(500).json({ error: '랭킹 초기화 실패' });
} finally {
connection.release();
}
});



// 랭킹리셋 엔드포인트
app.post('/reset-rank_m',  isAuthenticated, async (req, res) => {
  const connection = await pool.getConnection();
  const token = req.header('Authorization')?.split(' ')[1];

  let userNickname
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }
userNickname = decoded.username})}

  try {
    if (userNickname==="admin_m") {

    await connection.beginTransaction();

    // Insert into m_oldrecord
  const insertMOldrecordQuery = `
    INSERT INTO m_oldrecord (Nickname, BScore, LScore, Class, Month)
    SELECT Nickname, BScore, LScore, Class, DATE_FORMAT(NOW(), '%Y-%m-01')
    FROM m_user;
  `;
  await connection.query(insertMOldrecordQuery);

  const backuphistoryQuery = `
  INSERT INTO m_oldhistory (Date, Winner, Loser, Win2, Win3, Win4, Lose2, Lose3, Lose4, WScore, LScore)
  SELECT Date, Winner, Loser, Win2, Win3, Win4, Lose2, Lose3, Lose4, WScore, LScore
  FROM m_record
`;
await connection.query(backuphistoryQuery);

const backuptournQuery = `
INSERT INTO m_oldtournament (eventname, Championship, Runner_up, Place3rd, numberteams)
SELECT eventname, Championship1, Runner_up1, Place3rd1, numberteams
FROM m_eventrecord
WHERE teamSize = 1 AND accept = 2
`;
await connection.query(backuptournQuery);

  // 점수 초기화
  const resetBScoreQuery = `
    UPDATE m_user
    SET BScore = ? , LScore = 0
  `;
  await connection.query(resetBScoreQuery,[startscore_b]);

  // Delete from m_record
  const deleteMRecordQuery = `
    DELETE FROM m_record;
  `;
  await connection.query(deleteMRecordQuery);

  // Delete from m_temp
  const deleteMTempQuery = `
    DELETE FROM m_temp;
  `;
  await connection.query(deleteMTempQuery);

  // Delete from m_eventrecord
  const deleteMEventrecordQuery = `
  DELETE FROM m_eventrecord;
`;
await connection.query(deleteMEventrecordQuery);


// createAdmin_m(); // 어드민 계정 생성함수
await connection.commit();
res.json({ success: true });
console.log('계정 데이터를 초기화하였습니다');
} else {
  res.status(403).json({error: '권한이 없습니다'});

}
} catch (error) {
await connection.rollback();
console.error('랭킹 초기화 실패', error);
res.status(500).json({ error: '랭킹 초기화 실패' });
} finally {
connection.release();
}
});





// 이메일 변경 엔드 포인트
app.post('/process_changeemail',  isAuthenticated, async (req, res) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];

    let userNickname
    if (token) {
      jwt.verify(token, secretKey, (err, decoded) => {
          if (err) {
              return res.sendStatus(403); // Forbidden
          }
userNickname = decoded.username})}


    console.log(userNickname + ' 이메일변경 요청 확인');

    if (!userNickname) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 프론트엔드에서 전송한 이메일 및 암호 데이터
    const { nowpw, newemail } = req.body;

// 사용자의 현재 암호 확인
const connection = await pool.getConnection();
const result = await connection.query('SELECT pw FROM b_user WHERE Nickname = ?', [userNickname]);
connection.release();

if (result.length === 0) {
  console.log('사용자를 찾지 못함');
  return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
}

const currentPasswordHash = result[0].pw;

// 현재 암호 검증
const passwordMatch = await bcrypt.compare(nowpw, currentPasswordHash);

if (!passwordMatch) {
  return res.status(401).json({ error: '현재 암호가 일치하지 않습니다.' });
}


    // 새로운 이메일로 업데이트
    const updateResult = await connection.query('UPDATE b_user SET email = ? WHERE Nickname = ?', [newemail, userNickname]);

    if (updateResult.affectedRows === 1) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: '이메일 업데이트에 실패했습니다.' });
    }
  } catch (error) {
    console.error('이메일 변경 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});



// 이메일 변경 엔드 포인트
app.post('/process_changeemail_m',  isAuthenticated, async (req, res) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];

    let userNickname
    if (token) {
      jwt.verify(token, secretKey, (err, decoded) => {
          if (err) {
              return res.sendStatus(403); // Forbidden
          }
userNickname = decoded.username})}
console.log(userNickname + ' 이메일변경 요청 확인');

    if (!userNickname) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 프론트엔드에서 전송한 이메일 및 암호 데이터
    const { nowpw, newemail } = req.body;

// 사용자의 현재 암호 확인
const connection = await pool.getConnection();
const result = await connection.query('SELECT pw FROM m_user WHERE Nickname = ?', [userNickname]);
connection.release();

if (result.length === 0) {
  console.log('사용자를 찾지 못함');
  return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
}

const currentPasswordHash = result[0].pw;

// 현재 암호 검증
const passwordMatch = await bcrypt.compare(nowpw, currentPasswordHash);

if (!passwordMatch) {
  return res.status(401).json({ error: '현재 암호가 일치하지 않습니다.' });
}


    // 새로운 이메일로 업데이트
    const updateResult = await connection.query('UPDATE m_user SET email = ? WHERE Nickname = ?', [newemail, userNickname]);

    if (updateResult.affectedRows === 1) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: '이메일 업데이트에 실패했습니다.' });
    }
  } catch (error) {
    console.error('이메일 변경 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});





// 계정 삭제 엔드 포인트
app.delete('/delete_account',  isAuthenticated, async (req, res) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];

    let userNickname
    if (token) {
      jwt.verify(token, secretKey, (err, decoded) => {
          if (err) {
              return res.sendStatus(403); // Forbidden
          }
userNickname = decoded.username})}


    console.log(userNickname + ' 계정 삭제 요청 확인');

    if (!userNickname) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 프론트엔드에서 전송한 이메일 및 암호 데이터
    const { nowpw } = req.body;

// 사용자의 현재 암호 확인
const connection = await pool.getConnection();
const result = await connection.query('SELECT pw FROM b_user WHERE Nickname = ?', [userNickname]);
connection.release();

if (result.length === 0) {
  console.log('사용자를 찾지 못함');
  return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
}

const currentPasswordHash = result[0].pw;

// 현재 암호 검증
const passwordMatch = await bcrypt.compare(nowpw, currentPasswordHash);

if (!passwordMatch) {
  return res.status(401).json({ error: '현재 암호가 일치하지 않습니다.' });
}


// 계정 삭제하기

const delelte_account = await connection.query('DELETE from b_user WHERE Nickname = ?', [userNickname]);

    if (delelte_account.affectedRows === 1) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: '계정 삭제에 실패했습니다.' });
    }
  } catch (error) {
    console.error('계정 삭제 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});


// 계정 삭제 엔드 포인트
app.delete('/delete_account_m',  isAuthenticated, async (req, res) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];

    let userNickname
    if (token) {
      jwt.verify(token, secretKey, (err, decoded) => {
          if (err) {
              return res.sendStatus(403); // Forbidden
          }
userNickname = decoded.username})}


    console.log(userNickname + ' 계정 삭제 요청 확인');

    if (!userNickname) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 프론트엔드에서 전송한 이메일 및 암호 데이터
    const { nowpw } = req.body;

// 사용자의 현재 암호 확인
const connection = await pool.getConnection();
const result = await connection.query('SELECT pw FROM m_user WHERE Nickname = ?', [userNickname]);
connection.release();

if (result.length === 0) {
  console.log('사용자를 찾지 못함');
  return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
}

const currentPasswordHash = result[0].pw;

// 현재 암호 검증
const passwordMatch = await bcrypt.compare(nowpw, currentPasswordHash);

if (!passwordMatch) {
  return res.status(401).json({ error: '현재 암호가 일치하지 않습니다.' });
}


// 계정 삭제하기

const delelte_account = await connection.query('DELETE from m_user WHERE Nickname = ?', [userNickname]);

    if (delelte_account.affectedRows === 1) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: '계정 삭제에 실패했습니다.' });
    }
  } catch (error) {
    console.error('계정 삭제 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});






// 리그 데이터 제출하기

app.post('/submitevent',  isAuthenticated, async (req, res)=> {
try {
const eventdata = req.body;
const eventname = eventdata.eventname;
const numberteams = eventdata.numberteams;
const teamSize = eventdata.teamSize;
const Championship1 = eventdata.Championship1;
const Championship2 = eventdata.Championship2;
const Championship3 = eventdata.Championship3;
const Championship4 = eventdata.Championship4;
const Runner_up1 = eventdata.Runner_up1;
const Runner_up2 = eventdata.Runner_up2;
const Runner_up3 = eventdata.Runner_up3;
const Runner_up4 = eventdata.Runner_up4;
const Place3rd1 = eventdata.Place3rd1;
const Place3rd2 = eventdata.Place3rd2;
const Place3rd3 = eventdata.Place3rd3;
const Place3rd4 = eventdata.Place3rd4;
const Eventhost = eventdata.Eventhost;

const inputeventdata = `
  INSERT INTO b_eventrecord (
    accept,
    eventname,
    numberteams,
    teamSize,
    Championship1,
    Championship2,
    Championship3,
    Championship4,
    Runner_up1,
    Runner_up2,
    Runner_up3,
    Runner_up4,
    Place3rd1,
    Place3rd2,
    Place3rd3,
    Place3rd4,
    Eventhost
  )
  VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const connection = await pool.getConnection();
await connection.query(inputeventdata, [
  eventname,
  numberteams,
  teamSize,
  Championship1,
  Championship2,
  Championship3,
  Championship4,
  Runner_up1,
  Runner_up2,
  Runner_up3,
  Runner_up4,
  Place3rd1,
  Place3rd2,
  Place3rd3,
  Place3rd4,
  Eventhost,
]);

connection.release();
res.status(200).json({ message: 'Send Tournament Record to Server Success' });

} catch (error) {
console.error('Error adding record:', error);
res.status(500).json({ error: error.message || 'Internal Server Error' });
}
});



// 리그 데이터 제출하기

app.post('/submitevent_m',  isAuthenticated, async (req, res)=> {
  try {
  const eventdata = req.body;
  const eventname = eventdata.eventname;
  const numberteams = eventdata.numberteams;
  const teamSize = eventdata.teamSize;
  const Championship1 = eventdata.Championship1;
  const Championship2 = eventdata.Championship2;
  const Championship3 = eventdata.Championship3;
  const Championship4 = eventdata.Championship4;
  const Runner_up1 = eventdata.Runner_up1;
  const Runner_up2 = eventdata.Runner_up2;
  const Runner_up3 = eventdata.Runner_up3;
  const Runner_up4 = eventdata.Runner_up4;
  const Place3rd1 = eventdata.Place3rd1;
  const Place3rd2 = eventdata.Place3rd2;
  const Place3rd3 = eventdata.Place3rd3;
  const Place3rd4 = eventdata.Place3rd4;
  const Eventhost = eventdata.Eventhost;
  
  const inputeventdata = `
    INSERT INTO m_eventrecord (
      accept,
      eventname,
      numberteams,
      teamSize,
      Championship1,
      Championship2,
      Championship3,
      Championship4,
      Runner_up1,
      Runner_up2,
      Runner_up3,
      Runner_up4,
      Place3rd1,
      Place3rd2,
      Place3rd3,
      Place3rd4,
      Eventhost
    )
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const connection = await pool.getConnection();
  const result = await connection.query(inputeventdata, [
    eventname,
    numberteams,
    teamSize,
    Championship1,
    Championship2,
    Championship3,
    Championship4,
    Runner_up1,
    Runner_up2,
    Runner_up3,
    Runner_up4,
    Place3rd1,
    Place3rd2,
    Place3rd3,
    Place3rd4,
    Eventhost,
  ]);
  
  connection.release();
  res.status(200).json({ message: 'Send Tournament Record to Server Success' });
  
  } catch (error) {
  console.error('Error adding record:', error);
  res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
  });



// 토너먼트 히스토리 보기
  app.get('/eventhistory', async (req, res) => {
    try{
      const connection = await pool.getConnection();

    const eventdata = await connection.query(`
    SELECT
    eventname, numberteams, teamSize,
    Championship1, Championship2, Championship3, Championship4,
    Runner_up1, Runner_up2, Runner_up3, Runner_up4,
    Place3rd1, Place3rd2, Place3rd3, Place3rd4, Eventhost,
    accept 
    FROM b_eventrecord ORDER BY OrderNum DESC
    `);

    res.status(200).json(eventdata);
    connection.release();

  } catch (error) {
    console.error('데이터베이스 오류:', error);
    res.status(500).json({ error: 'DB Error' });
  }
  });


// 토너먼트 히스토리 보기
app.get('/eventhistory_m', async (req, res) => {
  try{
    const connection = await pool.getConnection();

  const eventdata = await connection.query(`
  SELECT
  eventname, numberteams, teamSize,
  Championship1, Championship2, Championship3, Championship4,
  Runner_up1, Runner_up2, Runner_up3, Runner_up4,
  Place3rd1, Place3rd2, Place3rd3, Place3rd4, Eventhost,
  accept 
  FROM m_eventrecord ORDER BY OrderNum DESC
  `);

  res.status(200).json(eventdata);
  connection.release();

} catch (error) {
  console.error('데이터베이스 오류:', error);
  res.status(500).json({ error: 'DB Error' });
}
});



// 토너먼트 히스토리 삭제
app.delete('/delete-event', isAuthenticated, async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];

  let userNickname
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }
userNickname = decoded.username})}


  const eventname = req.body.eventname;
  

  if (!eventname) {

    return res.status(400).json({ error: 'Invalid eventname' });
  }
  if (userNickname!=="admin" && userNickname!=="admin_m" ) {
   
    return res.status(400).json({ error: '권한이 없습니다' });
  }





  let connection;
  try {
    connection = await pool.getConnection();

    const updateQuery = `
      Delete from b_eventrecord
      WHERE eventname = ?;
    `;
    await connection.query(updateQuery, [eventname, ]);

    res.status(200).json({ message: 'Tournament Record deleted successfully' });
  } catch (error) {
    console.error('Error updating record in database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      connection.release(); // 연결 반환
    }
  }
});




// 토너먼트 히스토리 삭제
app.delete('/delete-event_m', isAuthenticated, async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];

  let userNickname
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }
userNickname = decoded.username})}
const eventname = req.body.eventname;

  if (!eventname) {

    return res.status(400).json({ error: 'Invalid eventname' });
  }
  if (userNickname!=="admin" && userNickname!=="admin_m" ) {
   
    return res.status(400).json({ error: '권한이 없습니다' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const updateQuery = `
      Delete from m_eventrecord
      WHERE eventname = ?;
    `;
    await connection.query(updateQuery, [eventname, ]);

    res.status(200).json({ message: 'Tournament Record deleted successfully' });
  } catch (error) {
    console.error('Error updating record in database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      connection.release(); // 연결 반환
    }
  }
});






// 토너먼트 히스토리 승인
app.post('/accept-event',  isAuthenticated, async (req, res) => {

  const eventname = req.body.eventname;
  const Championship1 = req.body.Championship1;
  const Championship2 = req.body.Championship2;
  const Championship3 = req.body.Championship3;
  const Championship4 = req.body.Championship4;
  const Runner_up1 = req.body.Runner_up1;
  const Runner_up2 = req.body.Runner_up2;
  const Runner_up3 = req.body.Runner_up3;
  const Runner_up4 = req.body.Runner_up4;
  const Place3rd1 = req.body.Place3rd1;
  const Place3rd2 = req.body.Place3rd2;
  const Place3rd3 = req.body.Place3rd3;
  const Place3rd4 = req.body.Place3rd4;
  const numberteams = req.body.numberteams;
  const teamSize = req.body.teamSize;
  const Eventhost = req.body.Eventhost;


  const updateQueriesCham = [Championship1, Championship2, Championship3, Championship4];
  const updateQueriesRunner = [Runner_up1, Runner_up2, Runner_up3, Runner_up4];
  const updateQueries3rd = [Place3rd1, Place3rd2, Place3rd3, Place3rd4];
const updateLScoreQuery = `
  UPDATE b_user
  SET LScore = LScore + ?
  WHERE Nickname = ?
`;


  if (!eventname) {
    return res.status(400).json({ error: 'Invalid eventname' });
  }  let connection;
try{
    connection = await pool.getConnection();
    await connection.beginTransaction();

  connection.query(updateLScoreQuery, [EventhostScore, Eventhost])

    const updateQuery = `
    UPDATE b_eventrecord
    SET accept = 2
    WHERE eventname = ?
  `;
    await connection.query(updateQuery, [eventname]);

        switch (numberteams) {
          case 2:
            for (const updateValue of updateQueriesCham) {
                await connection.query(updateLScoreQuery, [teams2ScoreB.Championship, updateValue]);
            }
            break;
          
case 4:
  for (const updateValue of updateQueriesCham) {
    if (teamSize == 1)
      {
      await connection.query(updateLScoreQuery, [teams4ScoreB.Championship, updateValue]);
    } else {
      await connection.query(updateLScoreQuery, [teams4TScoreB.Championship, updateValue]);
    }
    }
    for (const updateValue of updateQueriesRunner) {
      if (teamSize == 1)
        {
        await connection.query(updateLScoreQuery, [teams4ScoreB.Runner_up, updateValue]);
      } else {
        await connection.query(updateLScoreQuery, [teams4TScoreB.Runner_up, updateValue]);
      }
      }

      break;

case 8:
for (const updateValue of updateQueriesCham) {
  await connection.query(updateLScoreQuery, [teams8ScoreB.Championship, updateValue]);
}

for (const updateValue of updateQueriesRunner) {
  await connection.query(updateLScoreQuery, [teams8ScoreB.Runner_up, updateValue]);
}

for (const updateValue of updateQueries3rd) {
  await connection.query(updateLScoreQuery, [teams8ScoreB.Place3rd, updateValue]);
}

break;

case 16:

  for (const updateValue of updateQueriesCham) {
    await  connection.query(updateLScoreQuery, [teams16ScoreB.Championship, updateValue]);
  }
  for (const updateValue of updateQueriesRunner) {
    await  connection.query(updateLScoreQuery, [teams16ScoreB.Runner_up, updateValue]);
  }
    for (const updateValue of updateQueries3rd) {
    await  connection.query(updateLScoreQuery, [teams16ScoreB.Place3rd, updateValue]);
  }
  
  break;

case 24:

for (const updateValue of updateQueriesCham) {
  await connection.query(updateLScoreQuery, [teams24ScoreB.Championship, updateValue]);
}
for (const updateValue of updateQueriesRunner) {
  await connection.query(updateLScoreQuery, [teams24ScoreB.Runner_up, updateValue]);
}
for (const updateValue of updateQueries3rd) {
  await connection.query(updateLScoreQuery, [teams24ScoreB.Place3rd, updateValue]);
}
break;
        }
await connection.commit();

console.log(eventname + ' 히스토리 등록 및 점수 반영 완료');
res.status(200).json({ message: 'Accept successfully' });
} catch (error) {
  // 쿼리 실행 중 오류가 발생하면 롤백
  console.error('Error during transaction:', error);
  await connection.rollback();
} finally {
  // 연결 반환
  if (connection) {
    connection.release();
  }
}
});



// 토너먼트 히스토리 승인
app.post('/accept-event_m',  isAuthenticated, async (req, res) => {

  const eventname = req.body.eventname;
  const Championship1 = req.body.Championship1;
  const Championship2 = req.body.Championship2;
  const Championship3 = req.body.Championship3;
  const Championship4 = req.body.Championship4;
  const Runner_up1 = req.body.Runner_up1;
  const Runner_up2 = req.body.Runner_up2;
  const Runner_up3 = req.body.Runner_up3;
  const Runner_up4 = req.body.Runner_up4;
  const Place3rd1 = req.body.Place3rd1;
  const Place3rd2 = req.body.Place3rd2;
  const Place3rd3 = req.body.Place3rd3;
  const Place3rd4 = req.body.Place3rd4;
  const numberteams = req.body.numberteams;


  const updateQueriesCham = [Championship1, Championship2, Championship3, Championship4];
  const updateQueriesRunner = [Runner_up1, Runner_up2, Runner_up3, Runner_up4];
  const updateQueries3rd = [Place3rd1, Place3rd2, Place3rd3, Place3rd4];
const updateLScoreQuery = `
  UPDATE m_user
  SET LScore = LScore + ?
  WHERE Nickname = ?
`;


  if (!eventname) {
    return res.status(400).json({ error: 'Invalid eventname' });
  }  let connection;
try{
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const updateQuery = `
    UPDATE m_eventrecord
    SET accept = 2
    WHERE eventname = ?
  `;
    await connection.query(updateQuery, [eventname]);

        switch (numberteams) {
          case 2:
            for (const updateValue of updateQueriesCham) {
                await connection.query(updateLScoreQuery, [teams2ScoreM.Championship, updateValue+'_m']);
            }
            break;
          
case 4:
  for (const updateValue of updateQueriesCham) {
      await connection.query(updateLScoreQuery, [teams4ScoreM.Championship, updateValue+'_m']);
    }
    for (const updateValue of updateQueriesRunner) {
      await connection.query(updateLScoreQuery, [teams4ScoreM.Runner_up, updateValue+'_m']);
    }
    
      break;


case 8:
for (const updateValue of updateQueriesCham) {
  await connection.query(updateLScoreQuery, [teams8ScoreM.Championship, updateValue+'_m']);
}

for (const updateValue of updateQueriesRunner) {
  await connection.query(updateLScoreQuery, [teams8ScoreM.Runner_up, updateValue+'_m']);
}

for (const updateValue of updateQueries3rd) {
  await connection.query(updateLScoreQuery, [teams8ScoreM.Place3rd, updateValue+'_m']);
}

break;

case 16:

  for (const updateValue of updateQueriesCham) {
    await  connection.query(updateLScoreQuery, [teams16ScoreM.Championship, updateValue+'_m']);
  }
  for (const updateValue of updateQueriesRunner) {
    await  connection.query(updateLScoreQuery, [teams16ScoreM.Runner_up, updateValue+'_m']);
  }
    for (const updateValue of updateQueries3rd) {
    await  connection.query(updateLScoreQuery, [teams16ScoreM.Place3rd, updateValue+'_m']);
  }
  break;}

await connection.commit();

console.log(eventname + ' 히스토리 등록 및 점수 반영 완료');
res.status(200).json({ message: 'Accept successfully' });
} catch (error) {
  // 쿼리 실행 중 오류가 발생하면 롤백
  console.error('Error during transaction:', error);
  await connection.rollback();
} finally {
  // 연결 반환
  if (connection) {
    connection.release();
  }
}
});







// 글 목록을 보여주는 엔드포인트
app.get('/boardlistget', async (req, res) => {

  const category = req.query.data;
  const page = req.query.page;

  try {
    const connection = await pool.getConnection();
    let result
if (category==="all") {
  result = await connection.query('SELECT post_id, Nickname as writter, title, created_at as date, views FROM posts ORDER BY post_id DESC LIMIT 20 OFFSET ?',[(page - 1) * 20]);
} else {
  result = await connection.query('SELECT post_id, Nickname as writter, title, created_at as date, views FROM posts WHERE category = ? ORDER BY post_id DESC LIMIT 20 OFFSET ?',[category, (page - 1) * 20]);
}
    connection.release();
    res.json(result);

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).send('Internal Server Error');
  }
});



// 검색 기능 엔드포인트
app.get('/boardfind', async (req, res) => {

  const category = req.query.data;
  const word = req.query.find;

  try {
    const connection = await pool.getConnection();
    let result
if (category==="all") {
  result = await connection.query('SELECT post_id, Nickname as writter, title, created_at as date, views FROM posts WHERE MATCH(content, title) AGAINST(?) ORDER BY post_id DESC',[word]);
} else {
  result = await connection.query('SELECT post_id, Nickname as writter, title, created_at as date, views FROM posts WHERE category = ? AND  MATCH(content, title) AGAINST(?) ORDER BY post_id DESC',[category, word]);
}
    connection.release();
    res.json(result);
글
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).send('Internal Server Error');
  }
});



app.get('/network-test', async (req, res) => {
  let cloudinaryResult, httpResponse;

  try {
      cloudinaryResult = await cloudinary.api.resources({ max_results: 1 });
      console.log('Cloudinary status: success');
  } catch (error) {
      console.error('Cloudinary error:', error);
      return res.status(500).json({ cloudinaryStatus: 'fail', error: error.message });
  }

  try {
      httpResponse = await axios.get('https://www.google.com');
      console.log('HTTP request status: success');
  } catch (error) {
      console.error('HTTP request error:', error);
      return res.status(500).json({ httpStatus: 'fail', error: error.message });
  }

  res.json({
      cloudinaryStatus: 'success',
      result: cloudinaryResult,
      httpStatus: 'success',
      data: httpResponse.data
  });
});



// 이미지 업로드 기능

app.post('/uploadimage', (req, res) => {
  const { image } = req.body;

  cloudinary.uploader.upload(image, { upload_preset: 'img_default' }, (error, result) => {
      if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ error: error.message });
      }
      res.status(200).json({ url: result.secure_url });
  });
});


// 글 생성 엔드포인트
app.post('/writepost',  isAuthenticated, async (req, res) => {
  const { title, category, content, nickname, postId } = req.body;

  const safetycontent = DOMPurify.sanitize(content);

  if (!title || !safetycontent || !nickname) {
    return res.status(400).json({ error: 'Title, content, and nickname are required.' });
  }

  const connection = await pool.getConnection();

  try {
    if (postId != 'none') {

      // 글 수정
      const modifyQuery = `
        UPDATE posts
        SET title = ?,
            category = ?,
            content = ?,
            updated_at = NOW()
        WHERE post_id = ? AND Nickname = ?      
      `;

      connection.query(modifyQuery, [title, category, safetycontent, postId, nickname], (error, results) => {

        if (error) {
          console.error('Error modifying post:', error);
          return res.status(500).json({ error: 'Internal Server Error' });
        }

      });
      
    } else {
      // 글 생성
      const writeQuery = `
        INSERT INTO posts (title, content, Nickname, category)
        VALUES (?, ?, ?, ?)
      `;

      connection.query(writeQuery, [title, safetycontent, nickname, category], (error, results) => {

        if (error) {
          console.error('Error creating post:', error);
          return res.status(500).json({ error: 'Internal Server Error' });
        }

      });

    }
    console.log('Post successfully!');
    res.status(200).json({ message: 'Post successfully' });


  } catch (error) {
    console.error('Error handling post:', error);
    res.status(500).send('DB error');
  } finally {  
      connection.release(); // 연결 해제
  }
});





// 이미지 업로드하기
app.post('/uploadimage',  isAuthenticated, (req, res) => {
  const { image } = req.body;

  cloudinary.uploader.upload(image, { upload_preset: 'img_default' }, (error, result) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ url: result.secure_url });
  });
});





// post 보기

app.get('/postget', async (req, res) => {
  const postId = req.query.post_id;
  const connection = await pool.getConnection();

  try {
    //특정 게시물 가져오기
    const postQuery = 'SELECT title, Nickname as writter, content, created_at as date, updated_at as updated, views, category FROM posts WHERE post_id = ?';
    const [postResults] = await connection.query(postQuery, [postId]);


    if (postResults.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // UPDATE 쿼리 실행 (조회수 증가)
    await connection.query(`
      UPDATE posts
      SET views = views + 1
      WHERE post_id = ?`,
      [postId]
    );


    // 결과 전송
res.status(200).json(postResults);

  } catch (error) {
    console.error('Error fetching post and comments:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    connection.release();
  }
});



// 코멘트 가져오기
app.get('/commentget', async (req, res) => {
  const postId = req.query.post_id;
  const connection = await pool.getConnection();

  try {

    // 댓글 가져오기
    const commentsQuery = 'SELECT Nickname as writter, content, created_at as date, comment_id FROM comments WHERE post_id = ?';
const commentsResults = await connection.query(commentsQuery, [postId]);


    // 결과 전송
res.status(200).json(commentsResults);

  } catch (error) {
    console.error('Error fetching post and comments:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    connection.release();
  }
});




// 게시물 삭제
app.delete('/delete_post', async (req, res) => {
  const postId = req.body.post_id; // URL 파라미터로부터 postId 값을 추출
  const connection = await pool.getConnection();

  let deleteQuery = '';
    deleteQuery = `DELETE FROM posts WHERE post_id = ?`;

  try {
    await connection.query(deleteQuery, [postId]);
    res.status(200).send('Delete Success'); // 성공 시 응답
  } catch (error) {
    console.error(error);
    res.status(500).send('DB error Delete Fail');
  } finally {
    connection.release();
  }
});


// 댓글 달기
app.post('/addcomment',  isAuthenticated, async (req, res) => {
  const postId = req.body.post_id; // URL 파라미터로부터 postId 값을 추출
  const nickname = req.body.writter;
  const content = req.body.content;
  const connection = await pool.getConnection();
  let addcommentQuery = '';

    addcommentQuery = `INSERT INTO comments (content, post_id, Nickname) VALUES (?, ?, ?)`;

  try {
    await connection.query(addcommentQuery, [content, postId, nickname]);
    res.status(200).send('Add Comment Success'); // 성공 시 응답
  } catch (error) {
    res.status(500).send('DB error Add Comment Fail');
  } finally {
    connection.release();
  }
});


// 엔드포인트: 댓글 삭제하기
app.delete('/delete_comment',  isAuthenticated, async (req, res) => {
  const commentId = req.body.comment_id; // req.body에서 댓글 id 값을 직접 추출
  const connection = await pool.getConnection();

  try {
    let deleteCommentQuery = 'DELETE FROM comments WHERE comment_id = ?';

    await connection.query(deleteCommentQuery, [commentId]);
    res.status(200).send('Comment deleted successfully'); // 성공 시 응답
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).send('DB error: Comment delete failed');
  } finally {
    connection.release();
  }
});



// 어드민에 의한 계정 생성
app.post('/createnewname',  isAuthenticated, async (req, res) => {
  const { newname, wgrade } = req.body;

    // 기존에 생성한 전역 풀을 사용
    const connection = await pool.getConnection();

  try {

    // 닉네임을 소문자로 변환
    const lowerCaseNickname = newname.toLowerCase() + '_m';
    const currentDate = moment().utcOffset('+0900').format('YYYY-MM-DD HH:mm:ss');

    
    const result = await connection.query(
      'INSERT INTO m_user (Nickname, BScore, LScore, Class, Lastgame) VALUES (?, ?, ?, ?, ?)',
      [lowerCaseNickname, startscore_b, 0, wgrade, currentDate]
    );

    res.status(200).json({ success: true, message: '계정 등록이 완료되었습니다.' });

  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
  finally {
        // 연결 반환 대신에 release만 호출
    connection.release();
  }
});



// 클래스 및 무기 변경

app.post('/changeclass',  isAuthenticated, async (req, res) => {
const userData = req.body;
const classchangequery =  `
UPDATE b_user
SET Class = ?
WHERE Nickname = ?
`;
    // 기존에 생성한 전역 풀을 사용
    const connection = await pool.getConnection();
    try {
      await connection.query(classchangequery,[userData.userClassWeapon, userData.nickname])

res.status(200).json({ success: true, message: '변경 완료' });
     }
    catch(error){
      res.status(500).json({ success: false, error: '데이터베이스 에러' });
    }
    finally{
              // 연결 반환 대신에 release만 호출
    connection.release();

    }

});



// 클래스 및 무기 변경

app.post('/changeclass_m',  isAuthenticated, async (req, res) => {
  const userData = req.body;
  const classchangequery =  `
  UPDATE m_user
  SET Class = ?
  WHERE Nickname = ?
  `;
      // 기존에 생성한 전역 풀을 사용
      const connection = await pool.getConnection();
      try {
        await connection.query(classchangequery,[userData.userClassWeapon, userData.nickname])
  
  res.status(200).json({ success: true, message: '변경 완료' });
       }
      catch(error){
        res.status(500).json({ success: false, error: '데이터베이스 에러' });
      }
      finally{
                // 연결 반환 대신에 release만 호출
      connection.release();
  
      }
  
  });
  
  





// 승인된 토너먼트 삭제 및 점수 제거

app.delete('/cancel-accepted', async (req, res) =>{


  const eventname = req.body.eventname;
  const teamSize = req.body.teamSize;
  const numberteams = req.body.numberteams;
  const Championship1 = req.body.Championship1;
const Championship2 = req.body.Championship2;
const Championship3 = req.body.Championship3;
const Championship4 = req.body.Championship4;
const Runner_up1 = req.body.Runner_up1;
const Runner_up2 = req.body.Runner_up2;
const Runner_up3 = req.body.Runner_up3;
const Runner_up4 = req.body.Runner_up4;
const Place3rd1 = req.body.Place3rd1;
const Place3rd2 = req.body.Place3rd2;
const Place3rd3 = req.body.Place3rd3;
const Place3rd4 = req.body.Place3rd4;
const Eventhost = req.body.Eventhost;

const updateQueriesCham = [Championship1, Championship2, Championship3, Championship4];
const updateQueriesRunner = [Runner_up1, Runner_up2, Runner_up3, Runner_up4];
const updateQueries3rd = [Place3rd1, Place3rd2, Place3rd3, Place3rd4];

const updateLScoreQuery = `
  UPDATE b_user
  SET LScore = LScore - ?
  WHERE Nickname = ?
`;





  if (!eventname) {

    return res.status(400).json({ error: 'Invalid eventname' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    connection.query(updateLScoreQuery, [EventhostScore, Eventhost])

switch (numberteams) {
  case 2:
    for (const updateValue of updateQueriesCham) {
        await connection.query(updateLScoreQuery, [teams2ScoreB.Championship, updateValue]);
    }
    break;
  
case 4:

if (teamSize == 1) {
for (const updateValue of updateQueriesCham) {
await connection.query(updateLScoreQuery, [teams4ScoreB.Championship, updateValue]);
}
for (const updateValue of updateQueriesRunner) {
  await connection.query(updateLScoreQuery, [teams4ScoreB.Runner_up, updateValue]);
  }
} else {
  for (const updateValue of updateQueriesCham) {
    await connection.query(updateLScoreQuery, [teams4TScoreB.Championship, updateValue]);
    }
    for (const updateValue of updateQueriesRunner) {
      await connection.query(updateLScoreQuery, [teams4TScoreB.Runner_up, updateValue]);
      }
    }
break;


case 8:
for (const updateValue of updateQueriesCham) {
await connection.query(updateLScoreQuery, [teams8ScoreB.Championship, updateValue]);
}

for (const updateValue of updateQueriesRunner) {
await connection.query(updateLScoreQuery, [teams8ScoreB.Runner_up, updateValue]);
}

for (const updateValue of updateQueries3rd) {
await connection.query(updateLScoreQuery, [teams8ScoreB.Place3rd, updateValue]);
}

break;

case 16:

for (const updateValue of updateQueriesCham) {
await  connection.query(updateLScoreQuery, [teams16ScoreB.Championship, updateValue]);
}
for (const updateValue of updateQueriesRunner) {
await  connection.query(updateLScoreQuery, [teams16ScoreB.Runner_up, updateValue]);
}
for (const updateValue of updateQueries3rd) {
await  connection.query(updateLScoreQuery, [teams16ScoreB.Place3rd, updateValue]);
}

break;

case 24:

for (const updateValue of updateQueriesCham) {
await connection.query(updateLScoreQuery, [teams24ScoreB.Championship, updateValue]);
}
for (const updateValue of updateQueriesRunner) {
await connection.query(updateLScoreQuery, [teams24ScoreB.Runner_up, updateValue]);
}
for (const updateValue of updateQueries3rd) {
await connection.query(updateLScoreQuery, [teams24ScoreB.Place3rd, updateValue]);
}
break;
}




    const updateQuery = `
      Delete from b_eventrecord
      WHERE eventname = ?;
    `;
    await connection.query(updateQuery, [eventname, ]);


    await connection.commit();
    res.status(200).json({ message: '승인된 토너먼트 기록을 삭제하고 점수를 원래대로 변경하였습니다.' });
    console.log(eventname + '토너먼트 기록을 삭제하고 점수를 반환하였습니다')
  } catch (error) {
    console.error('Error updating record in database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) {

      connection.release(); // 연결 반환
    }
  }


} )




// 승인된 토너먼트 삭제 및 점수 제거

app.delete('/cancel-accepted_m', async (req, res) =>{


  const eventname = req.body.eventname;
  const numberteams = req.body.numberteams;
  const Championship1 = req.body.Championship1;
const Championship2 = req.body.Championship2;
const Championship3 = req.body.Championship3;
const Championship4 = req.body.Championship4;
const Runner_up1 = req.body.Runner_up1;
const Runner_up2 = req.body.Runner_up2;
const Runner_up3 = req.body.Runner_up3;
const Runner_up4 = req.body.Runner_up4;
const Place3rd1 = req.body.Place3rd1;
const Place3rd2 = req.body.Place3rd2;
const Place3rd3 = req.body.Place3rd3;
const Place3rd4 = req.body.Place3rd4;

const updateQueriesCham = [Championship1, Championship2, Championship3, Championship4];
const updateQueriesRunner = [Runner_up1, Runner_up2, Runner_up3, Runner_up4];
const updateQueries3rd = [Place3rd1, Place3rd2, Place3rd3, Place3rd4];

const updateLScoreQuery = `
  UPDATE m_user
  SET LScore = LScore - ?
  WHERE Nickname = ?
`;







  if (!eventname) {

    return res.status(400).json({ error: 'Invalid eventname' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();


    switch (numberteams) {
      case 2:
        for (const updateValue of updateQueriesCham) {
            await connection.query(updateLScoreQuery, [teams2ScoreM.Championship, updateValue+'_m']);
        }
        break;
      
    case 4:
    for (const updateValue of updateQueriesCham) {
    await connection.query(updateLScoreQuery, [teams4ScoreM.Championship, updateValue+'_m']);
    }
    for (const updateValue of updateQueriesRunner) {
      await connection.query(updateLScoreQuery, [teams4ScoreM.Runner_up, updateValue+'_m']);
      }
  
    break;
    
    
    case 8:
    for (const updateValue of updateQueriesCham) {
    await connection.query(updateLScoreQuery, [teams8ScoreM.Championship, updateValue+'_m']);
    }
    
    for (const updateValue of updateQueriesRunner) {
    await connection.query(updateLScoreQuery, [teams8ScoreM.Runner_up, updateValue+'_m']);
    }
    
    for (const updateValue of updateQueries3rd) {
    await connection.query(updateLScoreQuery, [teams8ScoreM.Place3rd, updateValue+'_m']);
    }
    
    break;
    
    case 16:
    
    for (const updateValue of updateQueriesCham) {
    await  connection.query(updateLScoreQuery, [teams16ScoreM.Championship, updateValue+'_m']);
    }
    for (const updateValue of updateQueriesRunner) {
    await  connection.query(updateLScoreQuery, [teams16ScoreM.Runner_up, updateValue+'_m']);
    }
    for (const updateValue of updateQueries3rd) {
    await  connection.query(updateLScoreQuery, [teams16ScoreM.Place3rd, updateValue+'_m']);
    }
    break;}


    const updateQuery = `
      Delete from m_eventrecord
      WHERE eventname = ?;
    `;
    await connection.query(updateQuery, [eventname]);


    await connection.commit();
    res.status(200).json({ message: '승인된 토너먼트 기록을 삭제하고 점수를 원래대로 변경하였습니다.' });
    console.log(eventname + '토너먼트 기록을 삭제하고 점수를 반환하였습니다')
  } catch (error) {
    console.error('Error updating record in database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) {

      connection.release(); // 연결 반환
    }
  }
} )


// 이벤트 텍스트 불러오기
app.get('/eventtext', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const yearmonth = String(req.query.year) + String(req.query.month).padStart(2, '0');
    const getQuery = `
      SELECT text, date FROM b_calendar WHERE yearmonth = ? 
    `;
    const eventtext = await connection.query(getQuery, [yearmonth]);

    res.status(200).json(eventtext);
  } catch (error) {
    res.status(500).json({ error: '이벤트 기록을 불러오는데 실패했습니다' });
    console.log('이벤트 기록 로딩 실패');
  } finally {
    if (connection) connection.release();
  }
});


// 이벤트 텍스트 불러오기
app.get('/eventtext_m', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const yearmonth = String(req.query.year) + String(req.query.month).padStart(2, '0');
    const getQuery = `
      SELECT text, date FROM m_calendar WHERE yearmonth = ? 
    `;
    const eventtext = await connection.query(getQuery, [yearmonth]);

    res.status(200).json(eventtext);
  } catch (error) {
    res.status(500).json({ error: '이벤트 기록을 불러오는데 실패했습니다' });
    console.log('이벤트 기록 로딩 실패');
  } finally {
    if (connection) connection.release();
  }
});





// 이벤트 텍스트 기록하기
app.post('/changetext',  isAuthenticated, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const yearmonth = String(req.body.year) + String(req.body.month).padStart(2, '0');
    const yearmonthdate = yearmonth + String(req.body.day).padStart(2, '0');
    const date = req.body.day;
    const text = req.body.event;

    const deletetextQuery = `DELETE from b_calendar WHERE yearmonthdate = ?`;
    await connection.query(deletetextQuery, [yearmonthdate]);

    const writetextQuery = `INSERT INTO b_calendar (yearmonth, yearmonthdate, date, text)
    VALUES (?, ?, ?, ?)`;
    await connection.query(writetextQuery, [yearmonth, yearmonthdate, date, text]);

    res.status(200).json({ message: '달력 이벤트 기록 성공' });
  } catch (error) {
    res.status(500).json({ error: '이벤트 기록을 저장하는데 실패했습니다' });
  } finally {
    if (connection) connection.release();
  }
});


// 이벤트 텍스트 기록하기
app.post('/changetext_m',  isAuthenticated, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const yearmonth = String(req.body.year) + String(req.body.month).padStart(2, '0');
    const yearmonthdate = yearmonth + String(req.body.day).padStart(2, '0');
    const date = req.body.day;
    const text = req.body.event;

    const deletetextQuery = `DELETE from m_calendar WHERE yearmonthdate = ?`;
    await connection.query(deletetextQuery, [yearmonthdate]);

    const writetextQuery = `INSERT INTO m_calendar (yearmonth, yearmonthdate, date, text)
    VALUES (?, ?, ?, ?)`;
    await connection.query(writetextQuery, [yearmonth, yearmonthdate, date, text]);

    res.status(200).json({ message: '달력 이벤트 기록 성공' });
  } catch (error) {
    res.status(500).json({ error: '이벤트 기록을 저장하는데 실패했습니다' });
  } finally {
    if (connection) connection.release();
  }
});



app.get('/loadoldrecord', async (req, res) => {
  let connection;
  try {
    connection =await pool.getConnection();
    const yearmonth = await connection.query(`SELECT DISTINCT year, month
  FROM (
      SELECT 
      YEAR(DATE_SUB(Month, INTERVAL 1 MONTH)) AS year,
      MONTH(DATE_SUB(Month, INTERVAL 1 MONTH)) AS month,
              ROW_NUMBER() OVER (PARTITION BY YEAR(Month), MONTH(Month) ORDER BY Month) AS row_num
      FROM b_oldrecord
  ) subquery
  WHERE row_num = 1;`)
  
  const data = await connection.query(`SELECT     YEAR(DATE_SUB(Month, INTERVAL 1 MONTH)) AS year,
      MONTH(DATE_SUB(Month, INTERVAL 1 MONTH)) AS month,
         Nickname, 
         Bscore + LScore AS tscore 
  FROM b_oldrecord
  WHERE Nickname != "admin"
  ORDER BY tscore DESC;
  `)
  const formattedData = data.map(row => ({
    ...row,
    year: Number(row.year),
    month: Number(row.month),
  }));    

  res.status(200).json({yearmonth:yearmonth, data: formattedData});
  connection.release();
  
} catch(error) {
    res.status(500).json(error);
  } 
  
  
  
  });
  
  
  app.get('/loadoldrecord_m', async (req, res) => {
    let connection;
    try {
      connection =await pool.getConnection();
      const yearmonth = await connection.query(`SELECT DISTINCT year, month
    FROM (
        SELECT 
       YEAR(DATE_SUB(Month, INTERVAL 1 MONTH)) AS year,
      MONTH(DATE_SUB(Month, INTERVAL 1 MONTH)) AS month,
            ROW_NUMBER() OVER (PARTITION BY YEAR(Month), MONTH(Month) ORDER BY Month) AS row_num
        FROM m_oldrecord
    ) subquery
    WHERE row_num = 1;`)
    
    const data = await connection.query(`SELECT     YEAR(DATE_SUB(Month, INTERVAL 1 MONTH)) AS year,
      MONTH(DATE_SUB(Month, INTERVAL 1 MONTH)) AS month,
           Nickname, 
           Bscore + LScore AS tscore 
    FROM m_oldrecord
    WHERE Nickname != "admin_m"
    ORDER BY tscore DESC;
    `)
    const formattedData = data.map(row => ({
      ...row,
      year: Number(row.year),
      month: Number(row.month),
    }));    

    res.status(200).json({yearmonth:yearmonth, data: formattedData});
    connection.release();

    } catch(error) {
      res.status(500).json(error);
    } 

  });


// 서버 레코드 데이터 가져오는 엔드포인트
app.get('/oldrecord', async (req, res) => {
  try {
    // 기존에 생성한 전역 풀을 사용
    const connection = await pool.getConnection();

    // b_oldrecord 테이블에서 데이터 가져오기
    const allrecord = await connection.query(`
    SELECT OrderNum, Date, Winner, Win2, Win3, Win4, Loser, Lose2, Lose3, Lose4, WScore, LScore
    FROM b_oldhistory
    ORDER BY OrderNum DESC;
    `);
    connection.release();

    // 날짜 형식 포맷 변경
    const formattedRecords = allrecord.map(record => {
      return {
        ...record,
        Date: new Intl.DateTimeFormat('en-US', {
          month: '2-digit',
          day: '2-digit'
        }).format(new Date(record.Date))
      };
    });

    res.json(formattedRecords);
  } catch (error) {
    console.error('기록 불러오기 실패:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});



// 닉네임과 순위를 가져오기
app.get("/rankscore", async (req, res) =>{

  try {    
    const connection = await pool.getConnection();
    const getNicknamebyScoreQuery = `Select Nickname as name from b_user ORDER by BScore + LScore DESC`;
const data = await connection.query(getNicknamebyScoreQuery);
const list = data.map(row => row.name);
let rank = [];
for (let i = 1; i <= list.length; i++) {
  rank.push(i);
}

res.json({nicknamelist: list, rank: rank})

  }
  catch (error) {
    res.status(500).json({ error: '서버 오류' });

  }
})


// 닉네임과 순위를 가져오기
app.get("/rankscore_m", async (req, res) =>{

  try {    
    const connection = await pool.getConnection();
    const getNicknamebyScoreQuery = `Select Nickname as name from m_user ORDER by BScore + LScore DESC`;
const data = await connection.query(getNicknamebyScoreQuery);
const list = data.map(row => row.name);
let rank = [];
for (let i = 1; i <= list.length; i++) {
  rank.push(i);
}

res.json({nicknamelist: list, rank: rank})

  }
  catch (error) {
    res.status(500).json({ error: '서버 오류' });

  }
})



// // 데이터베이스 조회 함수
// async function queryDatabaseAndSendStatus(ws, nickname) {
//   try {
//     const connection = await pool.getConnection();
//     const searchquery = `SELECT COUNT(*) AS count FROM b_temp WHERE Winner = ? AND Checked = 0`;
//     const results = await connection.query(searchquery, [nickname]);
//     connection.release(); // 연결 반환

//     // 조회 결과 처리
//     const count = Number(results[0].count);

//     ws.send(count.toString());
//   } catch (error) {
//     console.error('Error querying database:', error);
//   }
// }

// // 클라이언트 연결 시
// wss.on('connection', (ws) => {

//   // 클라이언트로부터 메시지 수신 시
//   ws.on('message', async (message) => {
//     const realmsg = message.toString(); // 버퍼를 문자열로 변환

//     try {
//       const data = JSON.parse(realmsg);
//       const nickname = data.nickname;

//       // 클라이언트에게 첫 번째 조회 진행
//       if (nickname) {
//         ws.send('checking'); // 클라이언트에게 조회 중임을 알림
//         await queryDatabaseAndSendStatus(ws, nickname); // 데이터베이스 조회 및 상태 전송
//       }

//       // 5초마다 데이터베이스 조회하여 상태를 클라이언트에게 전송
//       const interval = setInterval(async () => {
//         if (nickname) {
//           ws.send('checking'); // 클라이언트에게 조회 중임을 알림
//           await queryDatabaseAndSendStatus(ws, nickname); // 데이터베이스 조회 및 상태 전송
//         }
//       }, 5000);

//       // 클라이언트 연결 종료 시
//       ws.on('close', () => {
//         clearInterval(interval); // 인터벌 해제
//       });
//     } catch (error) {
//       console.error('Error parsing JSON:', error);
//     }
//   });
// });




const roundFloatToInt = (value) => {
  return Math.floor(value);
};

const roundFloatToTwoDecimals = (value) => {
  return Math.floor(value * 100) / 100;
};

const calculateRound = (params) => {
  let wincount = 0;
  let losecount = 0;

  for (let number = 0; number < params.iterations; number++) {
    let framecount = 0;
    let myframecheck = 0;
    let yourframecheck = 0;
    let mygamehp = params.myhp;
    let yourgamehp = params.yourhp;

    let mylv = params.mycharlv;
    if (params.myclass < 3) {
      mylv += 20;
    } else {
      mylv += 5;
    }

    let yourlv = params.yourcharlv;
    if (params.yourclass < 3) {
      yourlv += 20;
    } else {
      yourlv += 5;
    }

    while (mygamehp > 0 && yourgamehp > 0) {
      framecount++;
      myframecheck++;
      yourframecheck++;
      let mywoundcondition = 0;
      let yourwoundcondition = 0;

      if (myframecheck - params.myframe >= 0) {
        myframecheck = myframecheck - params.myframe;
        let r_number = Math.random();
        if (r_number < 0.25 * roundFloatToTwoDecimals(
          (100 - params.yourdodge) / 100 * params.myar / (
            params.myar + params.yourdf * (100 - (params.mydfoff / 2)) / 100) * 2 * mylv / (mylv + yourlv))) {
          r_number = Math.floor(Math.random() * 100) + 1;
          if (r_number < params.mycrush) {
            yourgamehp -= roundFloatToInt(yourgamehp / 10 / params.yourreduce * 100);
          }
          r_number = Math.floor(Math.random() * 100) + 1;
          if (r_number < params.myopenwound) {
            yourwoundcondition = 200;
          }
          r_number = roundFloatToInt(
            Math.floor(Math.random() * (params.mymaxdmg / 6 * params.yourreduce / 100 - params.mymindmg / 6 * params.yourreduce / 100 + 1)) + (
              params.mymindmg / 6 * params.yourreduce / 100));
          let cdsrandom = Math.floor(Math.random() * 100) + 1;
          if (cdsrandom < (params.mycs + params.myds * (100 - params.mycs) / 100)) {
            yourgamehp -= r_number;
          }
          yourgamehp -= r_number;
        }
        mygamehp -= (params.yourthorns / 6 * params.myreduce / 100);
      }

      if (yourframecheck - params.yourframe >= 0) {
        yourframecheck = yourframecheck - params.yourframe;
        let r_number = Math.random();
        if (r_number < 0.25 * roundFloatToTwoDecimals(
          (100 - params.mydodge) / 100 * params.yourar / (
            params.yourar + params.mydf * (100 - (params.yourdfoff / 2)) / 100) * 2 * yourlv / (yourlv + mylv))) {
          r_number = Math.floor(Math.random() * 100) + 1;
          if (r_number < params.yourcrush) {
            mygamehp -= roundFloatToInt(mygamehp / 10 / params.myreduce * 100);
          }
          r_number = Math.floor(Math.random() * 100) + 1;
          if (r_number < params.youropenwound) {
            mywoundcondition = 200;
          }
          r_number = roundFloatToInt(
            Math.floor(Math.random() * (params.yourmaxdmg / 6 * params.myreduce / 100 - params.yourmindmg / 6 * params.myreduce / 100 + 1)) + (
              params.yourmindmg / 6 * params.myreduce / 100));
          let cdsrandom = Math.floor(Math.random() * 100) + 1;
          if (cdsrandom < (params.yourcs + params.yourds * (100 - params.yourcs) / 100)) {
            mygamehp -= r_number;
          }
          mygamehp -= r_number;
        }
        yourgamehp -= (params.mythorns / 6 * params.yourreduce / 100);
      }

      if (mywoundcondition > 0) {
        mywoundcondition -= 1;
        if (mygamehp > (45 * params.yourcharlv - 1319) / 256) {
          mygamehp -= (45 * params.yourcharlv - 1319) / 256;
        } else {
          mygamehp = 1;
        }
      }
      if (yourwoundcondition > 0) {
        yourwoundcondition -= 1;
        if (yourgamehp > (45 * params.mycharlv - 1319) / 256) {
          yourgamehp -= (45 * params.mycharlv - 1319) / 256;
        } else {
          yourgamehp = 1;
        }
      }
      if (mygamehp <= 0 && yourgamehp > 0) {
        losecount += 1;
      }
      if (mygamehp > 0 && yourgamehp <= 0) {
        wincount += 1;
      }

      if (framecount > 15000) {
        console.warn("Loop count exceeded 15000, breaking to prevent infinite loop");
        break;
      }
    }
  }

  const drawcount = params.iterations - wincount - losecount;
  const winRate = wincount / params.iterations * 100;

  return {
    winCount: wincount,
    loseCount: losecount,
    drawCount: drawcount,
    winRate: winRate
  };
};

app.post('/calculate',  (req, res) => {
  const startTime = Date.now();
  const params = req.body;

  try {
    const result = calculateRound(params);
    const duration = Date.now() - startTime;
    console.info(`Request processed in ${duration} milliseconds`);
    res.json(result);
  } catch (e) {
    console.error(`Error processing request: ${e.message}`);
    res.status(400).json({ error: e.message });
  }
});







app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const port = process.env.PORT
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


