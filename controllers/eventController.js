const eventService = require('../services/eventService');

// b_user 리그 데이터 제출
const submitEvent = async (req, res) => {
  try {
    const eventdata = req.body;
    const result = await eventService.submitEvent(eventdata, 'b_eventrecord');
    res.status(200).json({ message: 'Send Tournament Record to Server Success' });
  } catch (error) {
    console.error('Error adding record:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// m_user 리그 데이터 제출
const submitEventM = async (req, res) => {
  try {
    const eventdata = req.body;
    const result = await eventService.submitEvent(eventdata, 'm_eventrecord');
    res.status(200).json({ message: 'Send Tournament Record to Server Success' });
  } catch (error) {
    console.error('Error adding record:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};


// b_user 이벤트 히스토리 조회
const getEventHistory = async (req, res) => {
    try {
      const eventdata = await eventService.getEventHistory('b_eventrecord');
      res.status(200).json(eventdata);
    } catch (error) {
      console.error('데이터베이스 오류:', error);
      res.status(500).json({ error: 'DB Error' });
    }
  };
  
  // m_user 이벤트 히스토리 조회
  const getEventHistoryM = async (req, res) => {
    try {
      const eventdata = await eventService.getEventHistory('m_eventrecord');
      res.status(200).json(eventdata);
    } catch (error) {
      console.error('데이터베이스 오류:', error);
      res.status(500).json({ error: 'DB Error' });
    }
  };
  
  // 이벤트 삭제
  const deleteEvent = async (req, res) => {
    try {
      const { eventname } = req.body;
      const userNickname = req.user.username;  // JWT 인증에서 추출한 닉네임
  
      if (!eventname) {
        return res.status(400).json({ error: 'Invalid eventname' });
      }
  
      if (userNickname !== 'admin' && userNickname !== 'admin_m') {
        return res.status(403).json({ error: '권한이 없습니다.' });
      }
  
      await eventService.deleteEvent('b_eventrecord', eventname);
      res.status(200).json({ message: 'Tournament Record deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  // m_user 이벤트 삭제
  const deleteEventM = async (req, res) => {
    try {
      const { eventname } = req.body;
      const userNickname = req.user.username;
  
      if (!eventname) {
        return res.status(400).json({ error: 'Invalid eventname' });
      }
  
      if (userNickname !== 'admin' && userNickname !== 'admin_m') {
        return res.status(403).json({ error: '권한이 없습니다.' });
      }
  
      await eventService.deleteEvent('m_eventrecord', eventname);
      res.status(200).json({ message: 'Tournament Record deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  // b_user 이벤트 승인
  const acceptEvent = async (req, res) => {
    try {
      const eventdata = req.body;
      await eventService.acceptEvent(eventdata,'b_user', 'teamsB');
      res.status(200).json({ message: 'Accept successfully' });
    } catch (error) {
      console.error('Error accepting event:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  // m_user 이벤트 승인
  const acceptEventM = async (req, res) => {
    try {
      const eventdata = req.body;
      await eventService.acceptEvent(eventdata, 'm_user', 'teamsM');
      res.status(200).json({ message: 'Accept successfully' });
    } catch (error) {
      console.error('Error accepting event:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

// 승인된 토너먼트 삭제 및 점수 제거
const cancelAcceptedEvent = async (req, res) => {
    const { eventname, teamSize, numberteams, Championship1, Championship2, Championship3, Championship4, Runner_up1, Runner_up2, Runner_up3, Runner_up4, Place3rd1, Place3rd2, Place3rd3, Place3rd4, Eventhost } = req.body;
  
    try {
      if (!eventname) {
        return res.status(400).json({ error: 'Invalid eventname' });
      }
      await eventService.cancelAccepted({
        eventname,
        teamSize,
        numberteams,
        Championship1,
        Championship2,
        Championship3,
        Championship4,
        Runner_up1,
        Runner_up2,
        Runner_up3,
        Runner_up4,
        Place3rd1,
        Place3rd2,
        Place3rd3,
        Place3rd4,
        Eventhost
      });
      res.status(200).json({ message: '승인된 토너먼트 기록을 삭제하고 점수를 원래대로 변경하였습니다.' });
    } catch (error) {
      console.error('Error updating record in database:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  // 승인된 m_user 토너먼트 삭제 및 점수 제거
  const cancelAcceptedEventM = async (req, res) => {
    const { eventname, numberteams, Championship1, Championship2, Championship3, Championship4, Runner_up1, Runner_up2, Runner_up3, Runner_up4, Place3rd1, Place3rd2, Place3rd3, Place3rd4 } = req.body;
  
    try {
      if (!eventname) {
        return res.status(400).json({ error: 'Invalid eventname' });
      }
      await eventService.cancelAcceptedM({
        eventname,
        numberteams,
        Championship1,
        Championship2,
        Championship3,
        Championship4,
        Runner_up1,
        Runner_up2,
        Runner_up3,
        Runner_up4,
        Place3rd1,
        Place3rd2,
        Place3rd3,
        Place3rd4
      });
      res.status(200).json({ message: '승인된 토너먼트 기록을 삭제하고 점수를 원래대로 변경하였습니다.' });
    } catch (error) {
      console.error('Error updating record in database:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  


  

module.exports = {
  submitEvent,
  submitEventM,
  getEventHistory,
  getEventHistoryM,
  deleteEvent,
  deleteEventM,
  acceptEvent,
  acceptEventM,
  cancelAcceptedEvent,
  cancelAcceptedEventM
};
