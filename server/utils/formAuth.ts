import * as User from "../controllers/user"
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
  username?: string
): { message: string }[] {

  const errors: { message: string }[] = []
  if (!username) {
    return [{ message: 'Must Be Signed In To Create Post' }]
  }

  if (!title || !desc || !audio || !audioSize) {
    console.log(audioSize)
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

  return errors
}



export {
  authorizeRegisterForm,
  authorizePostForm
}