const express = require('express');
const router = express.Router();
const userDataController = require('../controllers/userDataController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// b_user 사용자 정보 반환
router.get('/user_data', isAuthenticated, userDataController.getUserData);

// m_user 사용자 정보 반환
router.get('/user_data_m', isAuthenticated, userDataController.getUserDataM);

module.exports = router;
