const path = require('path');
const bodyParser = require('body-parser');
const express = require('express');

const configureServer = (app) => {
  // 정적 파일 제공
  app.use(express.static(path.join(__dirname, '../public')));

  // bodyParser 설정
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
};

module.exports = configureServer;
