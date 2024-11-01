const startscore = 1200;  // 기본 점수 설정
const startscore_b = 800;   // m_user 기본 점수 설정
const RecordScore = 20;  // 기록 점수 상수


const teams2ScoreB = {Championship: 10};
const teams4ScoreB = {Championship: 10, Runner_up: 5};
const teams8ScoreB = {Championship: 20, Runner_up: 10, Place3rd: 5};
const teams16ScoreB = {Championship: 30, Runner_up: 20, Place3rd: 10};
const teams24ScoreB = {Championship: 155, Runner_up: 103, Place3rd: 51};
const teams4TScoreB = {Championship: 20, Runner_up: 10};

const teams2ScoreM = {Championship: 10};
const teams4ScoreM = {Championship: 21, Runner_up: 11};
const teams8ScoreM = {Championship: 42, Runner_up: 22, Place3rd: 12};
const teams16ScoreM = {Championship: 83, Runner_up: 43, Place3rd: 23};
const teams24ScoreM = {Championship: 205, Runner_up: 105, Place3rd: 55};
const EventhostScore = 3






module.exports = {
  startscore,
  startscore_b,
  RecordScore,
  teams2ScoreB,
  teams4ScoreB,
  teams8ScoreB,
  teams16ScoreB,
  teams24ScoreB,
  teams4TScoreB,
  teams2ScoreM,
  teams4ScoreM,
  teams8ScoreM,
  teams16ScoreM,
  teams24ScoreM,
  EventhostScore,
};


