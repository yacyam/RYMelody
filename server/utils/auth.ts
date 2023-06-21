import * as User from "../controllers/user"
const emailCheck = /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/

async function authorizeRegisterForm(
  username: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<{ message: string }[]> {

  let errors: { message: string }[] = []

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

export {
  authorizeRegisterForm
}