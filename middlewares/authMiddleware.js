const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const refreshSecretKey = process.env.JWT_REFRESH; // 리프레시 토큰에 대한 비밀 키
const tokenExpiryTime = '1h'; // 액세스 토큰 만료 시간

exports.isAuthenticated = (req, res, next) => {
  // 쿠키에서 액세스 토큰과 리프레시 토큰 추출
  const token = req.cookies.d2rpvpjwtToken;
  const refreshToken = req.cookies.d2rpvprefreshToken;

  // 엑세스 토큰이 없을 때 리프레시 토큰 확인
  if (!token) {
    if (!refreshToken) {
      return res.sendStatus(401); // Unauthorized: 엑세스 토큰과 리프레시 토큰 모두 없음
    }

    // 리프레시 토큰 검증
    jwt.verify(refreshToken, refreshSecretKey, (refreshErr, refreshUser) => {
      if (refreshErr) {
        return res.sendStatus(403); // Forbidden: 리프레시 토큰이 유효하지 않음
      }

      // 리프레시 토큰이 유효하다면 새로운 엑세스 토큰 발급
      const newAccessToken = jwt.sign({ username: refreshUser.username }, secretKey, { expiresIn: tokenExpiryTime });

      // 새로운 액세스 토큰을 쿠키에 저장
      res.cookie('d2rpvpjwtToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송 (환경 설정 확인)
        sameSite: 'strict',
        maxAge: 3600000, // 1시간
      });

      req.user = refreshUser; // 리프레시 토큰에서 유저 정보 가져오기
      return next();
    });
  } else {
    // 엑세스 토큰 검증
    jwt.verify(token, secretKey, (err, user) => {
      if (err && err.name === 'TokenExpiredError') {
        // 액세스 토큰 만료 시 리프레시 토큰 검증
        if (!refreshToken) {
          return res.sendStatus(403); // Forbidden: 리프레시 토큰이 없음
        }

        // 리프레시 토큰 검증
        jwt.verify(refreshToken, refreshSecretKey, (refreshErr, refreshUser) => {
          if (refreshErr) {
            return res.sendStatus(403); // Forbidden: 리프레시 토큰이 유효하지 않음
          }

          // 리프레시 토큰이 유효하다면 새로운 액세스 토큰 발급
          const newAccessToken = jwt.sign({ username: refreshUser.username }, secretKey, { expiresIn: tokenExpiryTime });

          // 새로운 액세스 토큰을 쿠키에 저장
          res.cookie('d2rpvpjwtToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송 (환경 설정 확인)
            sameSite: 'strict',
            maxAge: 3600000, // 1시간
          });

          req.user = refreshUser; // 리프레시 토큰에서 유저 정보 가져오기
          next();
        });
      } else if (err) {
        return res.sendStatus(403); // Forbidden: 액세스 토큰이 유효하지 않음
      } else {
        // 액세스 토큰이 유효하면 유저 정보를 저장하고 다음 미들웨어로 이동
        req.user = user;
        next();
      }
    });
  }
};
