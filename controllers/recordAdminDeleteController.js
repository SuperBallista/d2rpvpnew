const recordDeleteService = require('../services/recordAdminDeleteService');

// b_user 기록 삭제
const deleteRecord = async (req, res) => {
  try {
    const userNickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용

    if (userNickname !== 'admin') {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    const { OrderNum } = req.body;
    await recordDeleteService.deleteRecord(OrderNum, 'b_record', 'b_user');
    res.status(200).json({ message: 'Row deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  deleteRecord,
};
