const eventService = require('../services/calendarService');

// 이벤트 텍스트 불러오기
const getEventText = async (req, res) => {
    try {
      const yearmonth = String(req.query.year) + String(req.query.month).padStart(2, '0');
      const isM = req.query.isM === 'true';
      const tableSuffix = isM ? 'm_' : 'b_'; // 'm_' 접미사 추가 여부 결정
      const eventtext = await eventService.fetchEventText(yearmonth, tableSuffix);
      res.status(200).json(eventtext);
    } catch (error) {
      res.status(500).json({ error: '이벤트 기록을 불러오는데 실패했습니다' });
    }
  };
  
  // 이벤트 텍스트 기록하기
  const changeEventText = async (req, res) => {
    try {
      const { year, month, day, event, isM } = req.body;
      const yearmonth = String(year) + String(month).padStart(2, '0');
      const yearmonthdate = yearmonth + String(day).padStart(2, '0');
      const isMBoolean = req.body.mode;
      const tableSuffix = isMBoolean ? 'm_' : 'b_'; // 'm_user' 테이블이면 'm_' 접미사 추가
  
      await eventService.saveEventText({ yearmonth, yearmonthdate, date: day, text: event }, tableSuffix);
      res.status(200).json({ message: '달력 이벤트 기록 성공' });
    } catch (error) {
      console.error('이벤트 기록 실패:', error);
      res.status(500).json({ error: '이벤트 기록을 저장하는데 실패했습니다' });
    }
  };
  
  
  module.exports = {
    getEventText,
    changeEventText,
  };