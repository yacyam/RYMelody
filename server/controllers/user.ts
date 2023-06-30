import { pool } from "../database/index";
import * as Query from "../database/queries"
import { User, OptionalUser } from "../database/User";
import { QueryResult } from 'pg'

async function findById(id: string | number): Promise<User | undefined> {
  const userDB = await pool.query(Query.findById, [id])
  const userRows = userDB.rows
  if (userRows.length === 0) {
    return undefined
  }
  const user: User = userRows[0]
  return user
}

async function findOne(userOpt: OptionalUser): Promise<User | undefined> {
  let userDB: QueryResult
  if (userOpt.username) {
    userDB = await pool.query(Query.findByUsername, [userOpt.username])
  }
  else if (userOpt.email) {
    userDB = await pool.query(Query.findByEmail, [userOpt.email])
  }
  else {
    return undefined
  }
  const userRows = userDB.rows

  if (userRows.length === 0) {
    return undefined
  }
  const user: User = userRows[0]

  return user
}

async function createUser(
  username: string,
  email: string,
  hashedPassword: string): Promise<void> {

  await pool.query(Query.createUser, [username, email, hashedPassword])

}

export {
  findById,
  findOne,
  createUser
}