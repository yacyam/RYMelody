import bcrypt from 'bcryptjs'

function hashPassword(password: string) {
  const salt = bcrypt.genSaltSync(10)
  return bcrypt.hashSync(password, salt)
}

function comparePassword(inputPass: string, dbPass: string) {
  return bcrypt.compareSync(inputPass, dbPass)
}

export {
  hashPassword,
  comparePassword
}