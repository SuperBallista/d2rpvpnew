const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// b_user 암호 변경
router.post('/process_changepw', isAuthenticated, passwordController.changePassword);

// m_user 암호 변경
router.post('/process_changepw_m', isAuthenticated, passwordController.changePasswordM);

module.exports = router;
