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
router.get('/recorddata_m', recordController.getRecordDataM);


// 미승인 기록 가져오기
router.get('/no_approved_record', isAuthenticated, recordController.getPendingRecords);
router.get('/no_approved_record_m', isAuthenticated, recordController.getPendingRecords_m);


// 도전자의 승리 기록 승인
router.post('/challengelose', isAuthenticated, recordController.challengelose);
// 도전자의 패배 기록 보내기
router.post('/challengewin', isAuthenticated, recordController.challengelose);


module.exports = router;
