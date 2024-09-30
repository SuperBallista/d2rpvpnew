const express = require('express');
const router = express.Router();
const eventController = require('../controllers/calendarController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// 이벤트 텍스트 불러오기 (일반과 m_user 함께 처리)
router.get('/eventtext', eventController.getEventText);

// 이벤트 텍스트 기록하기 (일반과 m_user 함께 처리)
router.post('/changetext', isAuthenticated, eventController.changeEventText);



module.exports = router;
