const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');

// b_user 임시 비밀번호 요청
router.post('/process_emailpw', passwordResetController.processEmailPw);

// m_user 임시 비밀번호 요청
router.post('/process_emailpw_m', passwordResetController.processEmailPwM);

module.exports = router;
