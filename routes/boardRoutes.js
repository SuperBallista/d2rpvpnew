const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// 게시글 관련 라우트
router.get('/boardlistget', boardController.getBoardList);
router.get('/boardfind', boardController.searchBoard);
router.get('/postget', boardController.getPost);
router.delete('/delete_post', isAuthenticated, boardController.deletePost);
router.post('/writepost', isAuthenticated, boardController.writePost);

// 댓글 관련 라우트
router.post('/addcomment', isAuthenticated, boardController.addComment);
router.delete('/delete_comment', isAuthenticated, boardController.deleteComment);
router.get('/commentget', boardController.getComments);
module.exports = router;
