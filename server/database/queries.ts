const getUsers = "SELECT * FROM users"
const findByUsername = "SELECT * FROM users WHERE username = $1"
const findByEmail = "SELECT * FROM users WHERE email = $1"
const findById = "SELECT * FROM users WHERE id = $1"

const createUser = "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)"

//
// POSTS
//
const getPosts = "SELECT posts.id, username, title, description FROM posts JOIN users ON posts.userId = users.id LIMIT $1"
const findPostById = "SELECT posts.id, username, title, description, audio FROM posts JOIN users ON posts.userId = users.id WHERE posts.id = $1"
const findCommentsById = "SELECT comments.id, username, comment FROM comments JOIN users ON comments.userId = users.id WHERE postId = $1"

const createPost = "INSERT INTO posts (userId, title, description, audio) VALUES ($1, $2, $3, $4)"
const createComment = "INSERT INTO comments (postId, userId, comment) VALUES ($1, $2, $3)"


export {
  getUsers,
  findByUsername,
  findByEmail,
  findById,
  createUser,
  getPosts,
  findPostById,
  findCommentsById,
  createPost,
  createComment
}