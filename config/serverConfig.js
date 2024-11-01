const path = require('path');
const bodyParser = require('body-parser');
const express = require('express');
const cookieParser = require('cookie-parser');
const csrf = require('csurf'); // CSRF 보호를 위한 미들웨어

const configureServer = (app) => {
  // 정적 파일 제공
  app.use(express.static(path.join(__dirname, '../public')));

  // bodyParser 설정
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
  
  // 쿠키 파서 설정
  app.use(cookieParser());

  // CSRF 보호 미들웨어 설정 (쿠키에 CSRF 토큰 저장)
  const csrfProtection = csrf({ cookie: true });
  app.use(csrfProtection);

  // CSRF 토큰을 클라이언트에 쿠키로 전달하는 미들웨어
  app.use((req, res, next) => {
    res.cookie('csrfToken', req.csrfToken()); // CSRF 토큰을 쿠키에 저장
    next();
  });
};

module.exports = configureServer;
