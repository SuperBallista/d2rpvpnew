const express = require('express');
const router = express.Router();
const rankController = require('../controllers/rankController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// b_user 랭킹 데이터
router.get('/rankdata', rankController.getRankData);

// m_user 랭킹 데이터
router.get('/rankdata_m', rankController.getRankDataM);


router.post('/challengeRank', isAuthenticated, rankController.challengeRank);


router.get('/challenge_data_m', isAuthenticated, rankController.challengeDataM);

module.exports = router;
