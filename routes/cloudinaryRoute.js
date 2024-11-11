// cloudinaryRoute.js
const express = require('express');
const cloudinaryController = require('../controllers/cloudinaryController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

const router = express.Router();

// JSON 데이터를 받는 라우트 설정
router.post('/uploadimage', isAuthenticated, cloudinaryController.uploadImageController);

module.exports = router;
