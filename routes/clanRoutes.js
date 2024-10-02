const express = require('express');
const router = express.Router();
const clanController = require('../controllers/clanController');
const { isAuthenticated } = require('../middlewares/authMiddleware');


// 클랜리스트 출력
router.get('/clanlist', clanController.clanlist);

// 클랜 가입 라우터
router.post('/clanjoin', isAuthenticated, clanController.clanJoin);

router.post('/submit-clan-reset', isAuthenticated, clanController.clanReset);

router.post('/admin_clan_score', isAuthenticated, clanController.adminClanScore);

router.get('/clanrank', clanController.clanRank);

router.get('/clanrecord', clanController.clanRecord);

router.delete('/delete_clan_record', isAuthenticated, clanController.clanRecordDelete)

router.post(`/submit_clan_record`, isAuthenticated, clanController.clanRecordSubmit)

router.get(`/no_approved_clan_record`, isAuthenticated, clanController.clanNoApprovedRecords)

router.post(`/delete-clan-record`, isAuthenticated, clanController.clanRecordCancel)

router.post(`/approve-clan-record`, isAuthenticated, clanController.clanRecordAccept)

module.exports = router;
