const jwt = require('jsonwebtoken');
const csrf = require('csurf');

const secretKey = process.env.JWT_SECRET;
const refreshSecretKey = process.env.JWT_REFRESH;
const tokenExpiryTime = '1h';

// CSRF 미들웨어 설정 (쿠키에 저장)
const csrfProtection = csrf({ cookie: true });

// 에러 처리 함수
const handleTokenError = (res, message, statusCode = 403) => {
  return res.status(statusCode).json({ message });
};

// 리프레시 토큰 처리 함수
const handleRefreshToken = (req, refreshToken, res, next) => {
  jwt.verify(refreshToken, refreshSecretKey, (refreshErr, refreshUser) => {
    if (refreshErr) {
      return handleTokenError(res, 'Forbidden: Invalid refresh token.');
    }

    // 리프레시 토큰이 유효하면 새로운 액세스 토큰 발급
    const newAccessToken = jwt.sign({ username: refreshUser.username }, secretKey, { expiresIn: tokenExpiryTime });

    // 새로운 액세스 토큰을 헤더에 저장
    res.setHeader('Access-Control-Expose-Headers', 'd2rpvpjwttoken');
    res.setHeader('d2rpvpjwttoken', newAccessToken);

    req.user = refreshUser;
    next();
  });
};

exports.isAuthenticated = [(req, res, next) => {
  const token = req.headers['d2rpvpjwttoken'];
  const refreshToken = req.cookies.d2rpvprefreshToken;


// 액세스 토큰 검증
if (!token || token === 'null' || token === '' || typeof token !== 'string') {
  // 액세스 토큰이 없거나 잘못된 값일 때
  if (!refreshToken) {
    return handleTokenError(res, 'Unauthorized: No access or refresh token provided.', 401);
  }
  // 리프레시 토큰을 사용하여 새로운 액세스 토큰 발급
  return handleRefreshToken(req, refreshToken, res, next);
}

// 액세스 토큰이 있을 때
jwt.verify(token, secretKey, (err, user) => {
  if (err) {
    // 액세스 토큰이 만료되었고 리프레시 토큰이 있을 때
    if (err.name === 'TokenExpiredError' && refreshToken) {
      return handleRefreshToken(req, refreshToken, res, next);
    } else {
      // 액세스 토큰이 유효하지 않을 때
      return handleTokenError(res, 'Forbidden: Invalid access token.');
    }
  }

  // 유효한 액세스 토큰이 있을 때
  req.user = user;
  next();
});
}, csrfProtection, (req, res, next) => {
  const csrfToken = req.headers['x-csrf-token'];

  // CSRF 토큰 검증
  if (!csrfToken || csrfToken !== req.cookies.csrfToken) {
    return handleTokenError(res, 'Forbidden: Invalid CSRF token.');
  }

  next();
}];
