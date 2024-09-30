const express = require('express');
const router = express.Router();
const accountDeleteController = require('../controllers/accountDeleteController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// b_user 계정 삭제
router.delete('/delete_account', isAuthenticated, accountDeleteController.deleteAccount);

// m_user 계정 삭제
router.delete('/delete_account_m', isAuthenticated, accountDeleteController.deleteAccountM);

module.exports = router;
