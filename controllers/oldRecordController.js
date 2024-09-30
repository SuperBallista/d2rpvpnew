const oldRecordService = require('../services/oldRecordService');

// 과거 기록 불러오기 - 일반 버전
const loadOldRecord = async (req, res) => {
  try {
    const records = await oldRecordService.fetchOldRecords('b_');
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json(error);
  }
};

// 과거 기록 불러오기 - m_user 버전
const loadOldRecordM = async (req, res) => {
  try {
    const records = await oldRecordService.fetchOldRecords('m_');
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json(error);
  }
};

// 과거 히스토리 데이터 불러오기 - 일반 버전
const loadOldHistory = async (req, res) => {
  try {
    const records = await oldRecordService.fetchOldHistory('b_');
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: '서버 오류' });
  }
};

// 과거 히스토리 데이터 불러오기 - m_user 버전
const loadOldHistoryM = async (req, res) => {
  try {
    const records = await oldRecordService.fetchOldHistory('m_');
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: '서버 오류' });
  }
};

// 순위 데이터 가져오기 - 일반 버전
const loadRankScore = async (req, res) => {
  try {
    const rankData = await oldRecordService.fetchRankData('b_');
    res.status(200).json(rankData);
  } catch (error) {
    res.status(500).json({ error: '서버 오류' });
  }
};

// 순위 데이터 가져오기 - m_user 버전
const loadRankScoreM = async (req, res) => {
  try {
    const rankData = await oldRecordService.fetchRankData('m_');
    res.status(200).json(rankData);
  } catch (error) {
    res.status(500).json({ error: '서버 오류' });
  }
};

module.exports = {
  loadOldRecord,
  loadOldRecordM,
  loadOldHistory,
  loadOldHistoryM,
  loadRankScore,
  loadRankScoreM
};
