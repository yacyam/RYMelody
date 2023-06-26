const getUsers = "SELECT * FROM users"
const findByUsername = "SELECT * FROM users WHERE username = $1"
const findByEmail = "SELECT * FROM users WHERE email = $1"
const findById = "SELECT * FROM users WHERE id = $1"

const createUser = "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)"

//
// POSTS
//
const getPosts = "SELECT posts.id, username, title, description FROM posts JOIN users ON posts.userId = users.id LIMIT $1"
const findPostById = "SELECT posts.id, posts.userId, username, title, description, audio FROM posts JOIN users ON posts.userId = users.id WHERE posts.id = $1"
const findCommentsById = "SELECT comments.id, username, comment FROM comments JOIN users ON comments.userId = users.id WHERE postId = $1"
const didUserLikePost = "SELECT * FROM postlikes WHERE userId = $1 AND postId = $2"
const getAllLikes = "SELECT COUNT(*) FROM postlikes WHERE postId = $1"
const getCommentId = "SELECT comments.id FROM comments WHERE postId = $1 AND userId = $2"

const createPost = "INSERT INTO posts (userId, title, description, audio) VALUES ($1, $2, $3, $4)"
const createComment = "INSERT INTO comments (postId, userId, comment) VALUES ($1, $2, $3)"
const createLike = "INSERT INTO postlikes (postId, userId) VALUES ($1, $2)"

const updateDescription = "UPDATE posts SET description = $1 WHERE id = $2"

const removeLike = "DELETE FROM postlikes WHERE postId = $1 AND userId = $2"
const deletePost = "DELETE FROM posts WHERE id = $1"
const deleteComments = "DELETE FROM comments WHERE postId = $1"
const deleteLikes = "DELETE FROM postlikes WHERE postId = $1"


export {
  getUsers,
  findByUsername,
  findByEmail,
  findById,
  createUser,
  getPosts,
  getAllLikes,
  getCommentId,
  findPostById,
  findCommentsById,
  didUserLikePost,
  createPost,
  createComment,
  createLike,
  removeLike,
  deletePost,
  deleteComments,
  deleteLikes,
  updateDescription
}