import * as User from "../controllers/user"
import * as Post from "../controllers/post"
import { Tags } from "../database/Post"
const emailCheck = /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/

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
    return [{ message: "Email Already Registered, Try Logging In." }]
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

function authorizePostForm(
  title: string,
  desc: string,
  audio: string,
  audioSize: number,
  tags: Tags,
  userId: number
): { message: string }[] {

  const errors: { message: string }[] = []
  if (userId === 0) {
    return [{ message: 'Must Be Signed In To Create Post' }]
  }

  if (!title || !desc || !audio || !audioSize) {
    return [{ message: 'All Fields Must Be Filled In' }]
  }

  if (title.length < 5 || title.length > 60) {
    errors.push({ message: 'Title Must Be 5 - 60 Characters Long ' })
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

async function authorizeCommentForm(
  postId: string,
  comment: string
): Promise<{ message: string }[]> {
  const errors: { message: string }[] = []

  const post = await Post.findById(postId)
  if (!post) {
    errors.push({ message: 'This Post Does Not Exist' })
  }
  if (comment.length < 4 || comment.length > 400) {
    errors.push({ message: 'Comment Must be 4 - 400 Characters Long' })
  }

  return errors
}

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

async function authorizeUserAndSession(
  userId: number,
  sessionUserId: number
) {
  if (isNaN(userId) || userId === Infinity || userId === undefined) {
    return [{ message: 'This User Profile Does Not Exist' }]
  }
  const user = await User.findById(userId)
  if (!user) {
    return [{ message: 'This User Profile Does Not Exist' }]
  }
  if (userId !== sessionUserId) {
    return [{ message: 'Must Be Signed In As User to Update Profile' }]
  }

  return []
}

async function authorizeUpdateProfile(
  userId: number,
  sessionUserId: number,
  text: string,
  textLength: number
): Promise<{ message: string }[]> {
  const errors = await authorizeUserAndSession(userId, sessionUserId)
  if (errors.length > 0) return errors

  if (text.length > textLength) {
    return [{ message: 'Contact Length Must be 5 - 50 Characters Long' }]
  }

  return []
}

export {
  authorizeRegisterForm,
  authorizePostForm,
  authorizeCommentForm,
  authorizeUpdateForm,
  authorizeUpdateProfile
}