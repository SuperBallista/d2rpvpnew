const express = require('express');
const router = express.Router();
const rankController = require('../controllers/rankController');

// b_user 랭킹 데이터
router.get('/rankdata', rankController.getRankData);

// m_user 랭킹 데이터
router.get('/rankdata_m', rankController.getRankDataM);

module.exports = router;
