import bcrypt from 'bcryptjs'
import Crypto from 'crypto'

function hashPassword(password: string) {
  const salt = bcrypt.genSaltSync(10)
  return bcrypt.hashSync(password, salt)
}

function comparePassword(inputPass: string, dbPass: string) {
  return bcrypt.compareSync(inputPass, dbPass)
}

function createToken(): string {
  const hash = Crypto.createHash('sha256')
  const salt = bcrypt.genSaltSync()
  hash.update(salt)
  const newToken: string = hash.digest('hex')
  return newToken
}

export {
  hashPassword,
  comparePassword,
  createToken
}