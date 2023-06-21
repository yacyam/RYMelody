const getUsers = "SELECT * FROM users"
const findByUsername = "SELECT * FROM users WHERE username = $1"
const findByEmail = "SELECT * FROM users WHERE email = $1"
const findById = "SELECT * FROM users WHERE id = $1"

const createUser = "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)"

export {
  getUsers,
  findByUsername,
  findByEmail,
  findById,
  createUser
}