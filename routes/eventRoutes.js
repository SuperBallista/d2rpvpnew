const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// b_user 리그 데이터 제출
router.post('/submitevent', isAuthenticated, eventController.submitEvent);

// m_user 리그 데이터 제출
router.post('/submitevent_m', isAuthenticated, eventController.submitEventM);

// b_user 이벤트 관련 라우트
router.get('/eventhistory', eventController.getEventHistory);
router.delete('/delete-event', isAuthenticated, eventController.deleteEvent);
router.post('/accept-event', isAuthenticated, eventController.acceptEvent);

// m_user 이벤트 관련 라우트
router.get('/eventhistory_m', eventController.getEventHistoryM);
router.delete('/delete-event_m', isAuthenticated, eventController.deleteEventM);
router.post('/accept-event_m', isAuthenticated, eventController.acceptEventM);

router.delete('/cancel-accepted',isAuthenticated, eventController.cancelAcceptedEvent);
router.delete('/cancel-accepted_m',isAuthenticated, eventController.cancelAcceptedEventM);

module.exports = router;
