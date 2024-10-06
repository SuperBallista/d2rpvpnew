const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const refreshSecretKey = process.env.JWT_REFRESH;

// 액세스 토큰 생성
exports.createAccessToken = (username) => {
  return jwt.sign({ username }, secretKey, { expiresIn: '1h' });
};

// 리프레시 토큰 생성
exports.createRefreshToken = (username) => {
  return jwt.sign({ username }, refreshSecretKey, { expiresIn: '7d' });
};

// 리프레시 토큰 검증
exports.verifyRefreshToken = (token) => {
  try {
    // refreshSecretKey를 사용하여 토큰을 검증
    return jwt.verify(token, refreshSecretKey);
  } catch (error) {
    console.error('리프레시 토큰 검증 오류:', error);
    return null; // 검증 실패 시 null을 반환
  }
};
