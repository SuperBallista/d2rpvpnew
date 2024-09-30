const createConnectionPool = require('../utils/dbConnection');
const pool = createConnectionPool();
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify'); // 올바르게 불러오기

// 글 목록 가져오기
const fetchBoardList = async (category, page) => {
  const connection = await pool.getConnection();
  try {
    let query, params;
    if (category === "all") {
      query = 'SELECT post_id, Nickname as writter, title, created_at as date, views FROM posts ORDER BY post_id DESC LIMIT 20 OFFSET ?';
      params = [(page - 1) * 20];
    } else {
      query = 'SELECT post_id, Nickname as writter, title, created_at as date, views FROM posts WHERE category = ? ORDER BY post_id DESC LIMIT 20 OFFSET ?';
      params = [category, (page - 1) * 20];
    }
    const result = await connection.query(query, params);
    return result;
  } finally {
    connection.release();
  }
};

// 게시글 검색
const searchBoardPosts = async (category, word) => {
  const connection = await pool.getConnection();
  try {
    let query, params;
    if (category === "all") {
      query = 'SELECT post_id, Nickname as writter, title, created_at as date, views FROM posts WHERE MATCH(content, title) AGAINST(?) ORDER BY post_id DESC';
      params = [word];
    } else {
      query = 'SELECT post_id, Nickname as writter, title, created_at as date, views FROM posts WHERE category = ? AND MATCH(content, title) AGAINST(?) ORDER BY post_id DESC';
      params = [category, word];
    }
    const result = await connection.query(query, params);
    return result;
  } finally {
    connection.release();
  }
};

// 글 작성
const createPost = async ({ title, category, content, nickname }) => {
  const connection = await pool.getConnection();
  try {
    const query = 'INSERT INTO posts (title, content, Nickname, category) VALUES (?, ?, ?, ?)';
    await connection.query(query, [title, content, nickname, category]);
  } finally {
    connection.release();
  }
};

// 글 수정
const modifyPost = async ({ title, category, content, postId, nickname }) => {
  const connection = await pool.getConnection();
  try {
    const query = 'UPDATE posts SET title = ?, category = ?, content = ?, updated_at = NOW() WHERE post_id = ? AND Nickname = ?';
    await connection.query(query, [title, category, content, postId, nickname]);
  } finally {
    connection.release();
  }
};

// 게시물 보기
const getPost = async (postId) => {
  const connection = await pool.getConnection();
  try {
    const query = 'SELECT title, Nickname as writter, content, created_at as date, updated_at as updated, views, category FROM posts WHERE post_id = ?';
    const [postResults] = await connection.query(query, [postId]);

    if (postResults.length === 0) {
      throw new Error('Post not found');
    }

    // 조회수 증가
    await connection.query('UPDATE posts SET views = views + 1 WHERE post_id = ?', [postId]);
    return postResults;
  } finally {
    connection.release();
  }
};

// 게시물 삭제
const deletePost = async (postId) => {
  const connection = await pool.getConnection();
  try {
    const query = 'DELETE FROM posts WHERE post_id = ?';
    await connection.query(query, [postId]);
  } finally {
    connection.release();
  }
};

// 댓글 추가
const addComment = async ({ postId, nickname, content }) => {
  const connection = await pool.getConnection();
  try {
    const query = 'INSERT INTO comments (content, post_id, Nickname) VALUES (?, ?, ?)';
    await connection.query(query, [content, postId, nickname]);
  } finally {
    connection.release();
  }
};

// 댓글 삭제
const deleteComment = async (commentId) => {
  const connection = await pool.getConnection();
  try {
    const query = 'DELETE FROM comments WHERE comment_id = ?';
    await connection.query(query, [commentId]);
  } finally {
    connection.release();
  }
};

// 내용 정화
const sanitizeContent = (content) => {
  // JSDOM을 사용하여 가상 window 생성
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window);  // DOMPurify 객체 생성
  return DOMPurify.sanitize(content);  // 생성한 객체로 sanitize 실행
};

// 코멘트 가져오기 서비스 함수
const fetchCommentsByPostId = async (postId) => {
  const connection = await pool.getConnection();
  try {
    const commentsQuery = 'SELECT Nickname as writter, content, created_at as date, comment_id FROM comments WHERE post_id = ?';
    const commentsResults = await connection.query(commentsQuery, [postId]);
    return commentsResults;
  } finally {
    connection.release();
  }
};


module.exports = {
  fetchBoardList,
  searchBoardPosts,
  createPost,
  modifyPost,
  getPost,
  deletePost,
  addComment,
  deleteComment,
  sanitizeContent,
  fetchCommentsByPostId,
};
