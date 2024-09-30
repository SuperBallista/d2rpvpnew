const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// b_user 기록 제출 라우트
router.post('/submitrecord', isAuthenticated, recordController.submitRecord);

// b_user 기록 승인 라우트
router.post('/approve-record', isAuthenticated, recordController.approveRecord);

// b_user 미승인 기록 삭제
router.post('/delete-record', isAuthenticated, recordController.deleteRecord);

// b_user 레코드 데이터 가져오기
router.get('/recorddata', recordController.getRecordData);

// 미승인 기록 가져오기
router.get('/no_approved_record', isAuthenticated, recordController.getPendingRecords);


module.exports = router;
