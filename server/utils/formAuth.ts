import * as User from "../controllers/user"
import * as Post from "../controllers/post"
import { Tags } from "../database/Post"
const emailCheck = /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/

const MIN_COMMENT_LEN = 4
const MAX_COMMENT_LEN = 400
/**
 * Checks if all registration parameters are valid to create a user
 * @param username 
 * @param email 
 * @param password 
 * @param confirmPassword 
 * @returns All the errors associated with the register form
 */
async function authorizeRegisterForm(
  username: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<{ message: string }[]> {

  const errors: { message: string }[] = []

  if (!username || !email || !password || !confirmPassword) {
    return [{ message: 'All Fields Must Be Filled In' }]
  }

  const usernameExists = await User.findOne({ username })
  const emailExists = await User.findOne({ email })

  if (emailExists) {
    return [{ message: "Email Already Registered, Try Logging In" }]
  }

  if (usernameExists) {
    errors.push({ message: 'Username Already Exists' })
  }

  if (username.length < 1 || username.length > 30) {
    errors.push({ message: 'Username Must Be 1 - 30 Characters' })
  }

  if (!emailCheck.test(email)) {
    errors.push({ message: 'Email Must Be In Valid Format' })
  }

  if (password.length < 8) {
    errors.push({ message: 'Password Must Be At Least 8 Characters' })
  }

  if (password !== confirmPassword) {
    errors.push({ message: 'Both Passwords Must Match' })
  }

  return errors
}

/**
 * Checks if all post parameters are valid to create a new post
 * @param title 
 * @param desc 
 * @param audio Audio file encoded inside of a string
 * @param audioSize Size of the audio file
 * @param tags 
 * @param userId 
 * @returns All errors associated with the post
 */
function authorizePostForm(
  title: string,
  desc: string,
  audio: string,
  audioSize: number,
  tags: Tags,
  userId: number
): { message: string }[] {

  const errors: { message: string }[] = []
  if (userId <= 0) {
    return [{ message: 'Must Be Signed In To Create Post' }]
  }

  if (!title || !desc || !audio || !audioSize) {
    return [{ message: 'All Fields Must Be Filled In' }]
  }

  if (title.length < 5 || title.length > 60) {
    errors.push({ message: 'Title Must Be 5 - 60 Characters Long' })
  }

  if (desc.length < 5 || desc.length > 800) {
    errors.push({ message: 'Description Must be 5 - 800 Characters Long' })
  }

  if (audioSize > 1048576) {
    errors.push({ message: 'File Size Too Large, Please Keep Below 1MB' })
  }

  if (Object.keys(tags).length !== 8) {
    errors.push({ message: 'Must Explicitly State All Tags' })
  }

  let allTags = 0
  const tagsSelected = Object.values(tags)
  tagsSelected.map((isSelected) => {
    if (isSelected) {
      allTags += 1
    }
  })

  if (allTags > 2) {
    errors.push({ message: 'Must Only Have At Most 2 Tags Selected' })
  }

  return errors
}

/**
 * Checks if comment parameters are valid to create a new comment
 * @param postId 
 * @param comment 
 * @returns All errors associated with the comment
 */
async function authorizeCommentForm(
  postId: string,
  comment: string
): Promise<{ message: string }[]> {
  const errors: { message: string }[] = []

  const post = await Post.findById(postId)
  if (!post) {
    errors.push({ message: 'This Post Does Not Exist' })
  }
  if (comment.length < MIN_COMMENT_LEN || comment.length > MAX_COMMENT_LEN) {
    errors.push({ message: `Comment Must be ${MIN_COMMENT_LEN} - ${MAX_COMMENT_LEN} Characters Long` })
  }

  return errors
}

/**
 * Checks if the post parameters are valid to update the description of a post
 * @param userId 
 * @param postId 
 * @param text 
 * @returns All the errors associated with the post update
 */
async function authorizeUpdateForm(
  userId: number,
  postId: string,
  text: string
): Promise<{ message: string }[]> {
  const errors: { message: string }[] = []

  const fullPost = await Post.findById(postId)
  if (!fullPost) {
    return [{ message: 'Cannot Edit Post That Does Not Exist' }]
  }
  if (fullPost.userid !== userId) {
    return [{ message: 'Must Be Original Poster to Edit Description' }]
  }

  if (text.length < 5 || text.length > 800) {
    errors.push({ message: 'Description Must be 5 - 800 Characters Long' })
  }

  return errors
}

/**
 * Checks if the user id and the user serialized into the session are the same
 * @param userId 
 * @param sessionUserId 
 * @returns All errors associated with the user authorization
 */
async function authorizeUserAndSession(
  userId: string,
  sessionUserId: number
) {
  const user = await User.findById(userId)
  if (!user) {
    return [{ message: 'This User Profile Does Not Exist' }]
  }

  if (user.id !== sessionUserId) {
    return [{ message: 'Must Be Signed In As User to Update Profile' }]
  }

  return []
}

/**
 * Checks whether the profile parameters are valid to update the profile with
 * the new text
 * @param userId 
 * @param sessionUserId 
 * @param text 
 * @param textLength 
 * @returns All errors associated with the profile update
 */
async function authorizeUpdateProfile(
  userId: string,
  sessionUserId: number,
  text: string,
  textLength: number
): Promise<{ message: string }[]> {
  const errors = await authorizeUserAndSession(userId, sessionUserId)
  if (errors.length > 0) return errors

  if (text.length > textLength) {
    return [{ message: `Inputted Text Length Must Be At Most ${textLength} Characters` }]
  }

  return []
}

/**
 * Checks whether all comment parameters are valid to update the comment
 * @param userId Id of the user attributed with the comment
 * @param sessionUserId Id of the user currently logged into session
 * @param commentId 
 * @param postId Id of post the comment is under
 * @param comment New comment to update the old one
 * @returns All the errors associated with the authorization
 */
async function authorizeUpdateComment(
  userId: number,
  sessionUserId: number,
  commentId: number,
  postId: string,
  comment: string
): Promise<{ message: string }[]> {
  const errors: { message: string }[] = []

  if (userId !== sessionUserId) {
    return [{ message: 'Must Be Original Commenter To Edit Comment' }]
  }

  const fullComment = await Post.findCommentById(commentId)

  if (!fullComment) {
    return [{ message: 'Comment Does Not Exist' }]
  }

  if (fullComment.userid !== userId) {
    //This should never happen but just in case db and frontend go out of sync
    errors.push({ message: 'Original Commenter Is Not Same As User In Session' })
  }

  if (`${fullComment.postid}` !== postId) {
    errors.push({ message: 'Editing Comment Under Different Post' })
  }

  if (comment.length < MIN_COMMENT_LEN || comment.length > MAX_COMMENT_LEN) {
    errors.push({ message: `Comment Must be ${MIN_COMMENT_LEN} - ${MAX_COMMENT_LEN} Characters Long` })
  }

  return errors
}

export {
  authorizeRegisterForm,
  authorizePostForm,
  authorizeCommentForm,
  authorizeUpdateForm,
  authorizeUpdateProfile,
  authorizeUpdateComment
}