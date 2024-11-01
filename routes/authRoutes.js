const express = require('express');
const router = express.Router();
const { processChangeEmail } = require('../controllers/emailController');
const authController = require('../controllers/authController'); // 올바른 경로
const { isAuthenticated } = require('../middlewares/authMiddleware');

// 일반 사용자 로그인 엔드포인트
router.post('/process_login', authController.processLogin);

// m_user 로그인 엔드포인트
router.post('/process_login_m', authController.processLoginM);



router.post(`/check_nickname`, authController.processNicknameCheck);
router.post(`/check_nickname_m`, authController.processNicknameCheckM);


// 일반 회원가입 엔드포인트
router.post('/process_regi', authController.processRegi);

// m_user 회원가입 엔드포인트
router.post('/process_regi_m', authController.processRegiM);

// jwt인증
router.get('/check-auth', isAuthenticated, authController.checkJwt);

// 일반 사용자 이메일 변경
router.post('/process_changeemail', isAuthenticated, (req, res) => {
    processChangeEmail(req, res, 'b_user');
  });
  
  // m_user 사용자 이메일 변경
  router.post('/process_changeemail_m', isAuthenticated, (req, res) => {
    processChangeEmail(req, res, 'm_user');
  });



module.exports = router;
