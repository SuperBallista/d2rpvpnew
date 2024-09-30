const boardService = require('../services/boardService');

// 글 목록 가져오기 (인증 불필요)
const getBoardList = async (req, res) => {
  const { data: category, page } = req.query;
  try {
    const result = await boardService.fetchBoardList(category, page);
    res.json(result);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 글 검색하기 (인증 불필요)
const searchBoard = async (req, res) => {
  const { data: category, find: word } = req.query;
  try {
    const result = await boardService.searchBoardPosts(category, word);
    res.json(result);
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 글 작성 및 수정 (인증 필요)
const writePost = async (req, res) => {
  const { title, category, content, postId } = req.body;
  try {
    const nickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용
    const safetycontent = boardService.sanitizeContent(content);

    if (!title || !safetycontent || !nickname) {
      return res.status(400).json({ error: 'Title, content, and nickname are required.' });
    }

    if (postId !== 'none') {
      await boardService.modifyPost({ title, category, content: safetycontent, postId, nickname });
    } else {
      await boardService.createPost({ title, category, content: safetycontent, nickname });
    }
    res.status(200).json({ message: 'Post successfully' });
  } catch (error) {
    console.error('Error handling post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 게시물 보기 (인증 불필요)
const getPost = async (req, res) => {
  const { post_id: postId } = req.query;
  try {
    const post = await boardService.getPost(postId);
    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 게시물 삭제 (인증 필요)
const deletePost = async (req, res) => {
  const { post_id: postId } = req.body;
  try {
    const nickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용
    await boardService.deletePost(postId, nickname); // 삭제 시 작성자 확인 추가 가능
    res.status(200).json({ message: 'Delete Success' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'DB error Delete Fail' });
  }
};

// 댓글 달기 (인증 필요)
const addComment = async (req, res) => {
  const { post_id: postId, content } = req.body;
  try {
    const nickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용
    await boardService.addComment({ postId, nickname, content });
    res.status(200).json({ message: 'Add Comment Success' });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'DB error Add Comment Fail' });
  }
};

// 댓글 삭제 (인증 필요)
const deleteComment = async (req, res) => {
  const { comment_id: commentId } = req.body;
  try {
    const nickname = req.user.username; // 미들웨어에서 인증된 사용자 정보 사용
    await boardService.deleteComment(commentId, nickname); // 삭제 시 작성자 확인 추가 가능
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'DB error: Comment delete failed' });
  }
};

// 코멘트 가져오기 (인증 불필요)
const getComments = async (req, res) => {
  const postId = req.query.post_id;

  try {
    const comments = await boardService.fetchCommentsByPostId(postId);
    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching post and comments:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getBoardList,
  searchBoard,
  writePost,
  getPost,
  deletePost,
  addComment,
  getComments,
  deleteComment
};
