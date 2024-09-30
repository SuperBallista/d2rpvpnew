const express = require('express');
const router = express.Router();
const nicknameController = require('../controllers/nicknameController');

// b_user Nickname 목록 가져오기
router.get('/getNicknames', nicknameController.getNicknames);

// m_user Nickname 목록 가져오기
router.get('/getNicknames_m', nicknameController.getNicknamesM);

module.exports = router;
