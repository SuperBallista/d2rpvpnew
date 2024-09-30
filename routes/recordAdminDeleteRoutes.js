const express = require('express');
const router = express.Router();
const recordAdminDeleteController = require('../controllers/recordAdminDeleteController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// b_user 기록 삭제
router.delete('/delete-row', isAuthenticated, recordAdminDeleteController.deleteRecord);

module.exports = router;
