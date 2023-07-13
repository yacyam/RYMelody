const getUsers = "SELECT * FROM users"
const findByUsername = "SELECT * FROM users WHERE username = $1"
const findByEmail = "SELECT * FROM users WHERE email = $1"
const findById = "SELECT * FROM users WHERE id = $1"
const findVerifyData = "SELECT * FROM verify WHERE token = $1"

const createUser = "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id"
const verifyUser = "UPDATE users SET verified = TRUE WHERE id = $1"

const insertToken = "INSERT INTO verify (userId, token) VALUES ($1, $2)"
const updateToken = "UPDATE verify SET token = $2, time_sent = NOW() WHERE userId = $1"

const deleteToken = "DELETE FROM verify WHERE userId = $1"

//
// POSTS
//
const tags = "electronic, hiphop, pop, rock, punk, metal, jazz, classical"
const searchQuery = "WHERE LOWER(title) LIKE ('%' || LOWER($2) || '%')"
const getPostTemplate = "SELECT posts.id, posts.userId, username, title, description FROM posts JOIN users ON posts.userId = users.id"

function createSearchQuery(sortQuery: string, tagsQuery: undefined | string[]) {
  let orderQuery = ""
  let joinQuery = ""
  let tagQuery = ""
  let searchAndTagQ = searchQuery
  const limit = "LIMIT $1"
  if (tagsQuery !== undefined) {
    joinQuery = "JOIN posttags ON posts.id = posttags.postId"
    tagQuery = "(" + tagsQuery.reduce((prev, curr) => {
      if (prev === "") {
        return curr + " = TRUE"
      }
      return prev + " OR " + curr + " = TRUE"
    }, "") + ")"
    searchAndTagQ += " AND " + tagQuery
  }

  if (sortQuery === '') {
    orderQuery = searchAndTagQ
  }
  if (sortQuery === 'ASC' || sortQuery === 'DESC') {
    orderQuery = searchAndTagQ + " ORDER BY time_posted " + (sortQuery === 'ASC' ? 'ASC' : 'DESC')
  }
  if (sortQuery === 'LIKES') {
    joinQuery += " LEFT JOIN postlikes ON posts.id = postlikes.postId "
    orderQuery = searchAndTagQ + " GROUP BY 1, 3 " + "ORDER BY COUNT(postlikes.id) DESC"
  }
  return getPostTemplate + " " + joinQuery + " " + orderQuery + " " + limit
}

const findPostById = "SELECT posts.id, posts.userId, username, title, description, audio FROM posts JOIN users ON posts.userId = users.id WHERE posts.id = $1"
const findCommentById = "SELECT id, userid, postid, comment FROM comments WHERE id = $1"
const getComments = "SELECT comments.id, comments.userId, username, comment FROM comments JOIN users ON comments.userId = users.id WHERE postId = $1 ORDER BY time_posted ASC"
const didUserLikePost = "SELECT * FROM postlikes WHERE userId = $1 AND postId = $2"
const getAllLikes = "SELECT COUNT(*) FROM postlikes WHERE postId = $1"
const getTags = `SELECT ${tags} FROM posttags WHERE postId = $1`
const findReplyById = "SELECT id, userId, commentId, replyId, postId, reply FROM postreply WHERE id = $1"
const getReplies =
  `SELECT p1.id, p1.userid, u1.username, p1.commentid, p1.replyid, p1.reply, p1.postid, 
p2.userid as rpuserid, u2.username as rpusername, p2.reply as rpreply
FROM postreply p1
JOIN users u1
ON p1.userid = u1.id
LEFT JOIN postreply p2
ON p1.replyid = p2.id
LEFT JOIN users u2
ON p2.userid = u2.id
WHERE p1.commentid = $1
ORDER BY p1.time_posted ASC`

const createPost = "INSERT INTO posts (userId, title, description, audio) VALUES ($1, $2, $3, $4) RETURNING id"
const createComment = "INSERT INTO comments (postId, userId, comment) VALUES ($1, $2, $3) RETURNING id"
const createLike = "INSERT INTO postlikes (postId, userId) VALUES ($1, $2)"
const createDefaultTags = "INSERT INTO posttags (postId) VALUES ($1)"
const createTags = `INSERT INTO posttags (postId, ${tags}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
const createReply = "INSERT INTO postreply (userId, commentId, replyId, postId, reply) VALUES ($1, $2, $3, $4, $5) RETURNING id"

const updateDescription = "UPDATE posts SET description = $1 WHERE id = $2"
const updateComment = "UPDATE comments SET comment = $1 WHERE id = $2"
const updateReply = "UPDATE postreply SET reply = $1 WHERE id = $2"

const removeLike = "DELETE FROM postlikes WHERE postId = $1 AND userId = $2"
const deletePost = "DELETE FROM posts WHERE id = $1"
const deleteComments = "DELETE FROM comments WHERE postId = $1"
const deleteComment = "DELETE FROM comments WHERE id = $1"
const deleteLikes = "DELETE FROM postlikes WHERE postId = $1"
const deleteTags = "DELETE FROM posttags WHERE postId = $1"
const deleteReply = "DELETE FROM postreply WHERE id = $1"

const deleteRepliesFromComment = "DELETE FROM postreply WHERE commentId = $1"
const deleteRepliesFromPost = "DELETE FROM postreply WHERE postId = $1"


//
// Profile
//

const findProfileById = "SELECT id, username, contact, bio FROM users JOIN userprofile ON users.id = userprofile.userId WHERE id = $1"
const getAllPosts = "SELECT posts.id, posts.userId, username, title, description FROM posts JOIN users ON posts.userId = users.id WHERE posts.userId = $1"
const getAllPostsFromLikes = "SELECT posts.id, posts.userId, username, title, description FROM posts JOIN users ON posts.userId = users.id JOIN postlikes ON posts.id = postlikes.postId WHERE postlikes.userId = $1"

const createDefaultProfile = "INSERT INTO userprofile (userId) VALUES ($1)"

const updateContact = "UPDATE userprofile SET contact = $2 WHERE userId = $1"
const updateBio = "UPDATE userprofile SET bio = $2 WHERE userId = $1"

export {
  getUsers,
  findByUsername,
  findByEmail,
  findById,
  findVerifyData,
  createUser,
  verifyUser,
  insertToken,
  updateToken,
  deleteToken,
  createSearchQuery,
  getAllLikes,
  findPostById,
  findCommentById,
  findReplyById,
  getComments,
  getTags,
  getReplies,
  didUserLikePost,
  createPost,
  createComment,
  createLike,
  createDefaultTags,
  createTags,
  createReply,
  removeLike,
  deletePost,
  deleteComments,
  deleteComment,
  deleteLikes,
  deleteTags,
  deleteReply,
  deleteRepliesFromComment,
  deleteRepliesFromPost,
  updateDescription,
  updateComment,
  updateReply,
  findProfileById,
  getAllPosts,
  getAllPostsFromLikes,
  createDefaultProfile,
  updateContact,
  updateBio
}