const getUsers = "SELECT * FROM users"
const findByUsername = "SELECT * FROM users WHERE username = $1"
const findByEmail = "SELECT * FROM users WHERE email = $1"
const findById = "SELECT * FROM users WHERE id = $1"

const createUser = "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)"

//
// POSTS
//
const getPosts = "SELECT id, username, title, description FROM posts LIMIT $1"

const createPost = "INSERT INTO posts (username, title, description, audio) VALUES ($1, $2, $3, $4)"


export {
  getUsers,
  findByUsername,
  findByEmail,
  findById,
  createUser,
  getPosts,
  createPost
}