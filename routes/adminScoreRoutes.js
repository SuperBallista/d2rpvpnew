const express = require('express');
const router = express.Router();
const adminScoreController = require('../controllers/adminScoreController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// b_user 점수 부여
router.post('/submit-admin-score', isAuthenticated, adminScoreController.submitAdminScore);

// m_user 점수 부여
router.post('/submit-admin-score_m', isAuthenticated, adminScoreController.submitAdminScoreM);


// b_user 랭킹 리셋
router.post('/reset-rank', isAuthenticated, adminScoreController.resetRank);

// m_user 랭킹 리셋
router.post('/reset-rank_m', isAuthenticated, adminScoreController.resetRankM);

module.exports = router;
