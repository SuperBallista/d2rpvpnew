const express = require('express');
const router = express.Router();
const oldRecordController = require('../controllers/oldRecordController');

// 과거 기록 불러오기
router.get('/loadoldrecord', oldRecordController.loadOldRecord);
router.get('/loadoldrecord_m', oldRecordController.loadOldRecordM);

// 과거 히스토리 데이터 불러오기
router.get('/oldrecord', oldRecordController.loadOldHistory);
router.get('/oldrecord_m', oldRecordController.loadOldHistoryM);

// 순위 데이터 불러오기
router.get('/rankscore', oldRecordController.loadRankScore);
router.get('/rankscore_m', oldRecordController.loadRankScoreM);

module.exports = router;
