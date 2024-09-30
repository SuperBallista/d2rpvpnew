// 환경변수 설정 (한 번만 설정)
require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const path = require('path');  // 추가된 부분
const authRoutes = require('./routes/authRoutes');
const rankRoutes = require('./routes/rankRoutes');
const configureServer = require('./config/serverConfig');
const nicknameRoutes = require('./routes/nicknameRoutes'); 
const recordRoutes = require('./routes/recordRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const userDataRoutes = require('./routes/userDataRoutes');
const adminScoreRoutes = require('./routes/adminScoreRoutes');
const recordAdminDeleteRoutes = require('./routes/recordAdminDeleteRoutes');
const accountDeleteRoutes = require('./routes/accountDeleteRoutes');
const eventRoutes = require('./routes/eventRoutes');
const boardRoutes = require('./routes/boardRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const oldRecordRoutes = require('./routes/oldRecordRoutes');
const calculateRoutes = require('./routes/calculateRoutes');
const cookieParser = require('cookie-parser');


const app = express();


// 서버 설정 (configureServer)
configureServer(app);
app.use(cookieParser());

// 각종 라우트 설정
app.use(express.json());
app.use('/', authRoutes); 
app.use('/', rankRoutes);
app.use('/api', nicknameRoutes);
app.use('/', recordRoutes);
app.use('/', passwordRoutes);
app.use('/', passwordResetRoutes);
app.use('/', userDataRoutes);
app.use('/', adminScoreRoutes);
app.use('/', recordAdminDeleteRoutes);
app.use('/', accountDeleteRoutes);
app.use('/', eventRoutes);
app.use('/', boardRoutes);
app.use('/', calendarRoutes);
app.use('/', oldRecordRoutes);
app.use('/', calculateRoutes);


app.post("/logout", (req, res) => {
  res.clearCookie("d2rpvpjwtToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  res.clearCookie("d2rpvprefreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  res.status(200).send("로그아웃 성공");
});






// 정적 파일 서빙
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/public', 'index.html'));
});

// 서버 시작
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
