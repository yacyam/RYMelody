import { pool } from "../database/index";
import * as Query from "../database/queries"
import { User, OptionalUser, Verify } from "../database/User";
import { QueryResult } from 'pg'

/**
 * Obtains user information associated with id
 * @param id 
 * @returns Main user info if user with id exists, otherwise returns undefined
 */
async function findById(id: string | number): Promise<User | undefined> {
  const userDB = await pool.query(Query.findById, [id])
  const userRows = userDB.rows
  if (userRows.length === 0) {
    return undefined
  }
  const user: User = userRows[0]
  return user
}

/**
 * Obtains the user associated with username or password
 * @param userOpt Contains either the username or email of the user
 * @returns Main user information if username/email exists, undefined otherwise
 */
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

/**
 * Registers a user with the username, email, and password
 * @param username 
 * @param email 
 * @param hashedPassword A hashed representation of the password 
 * @returns The id of the newly created user
 */
async function createUser(
  username: string,
  email: string,
  hashedPassword: string): Promise<number> {

  const userId: QueryResult = await pool.query(Query.createUser, [username, email, hashedPassword])

  return userId.rows[0].id
}

async function verifyUser(
  userId: number
): Promise<void> {

  await pool.query(Query.verifyUser, [userId])
}

/**
 * Inserts token used for verifying user
 * @param userId 
 * @param verifyToken Token associated with the link to verify the user
 */
async function insertToken(
  userId: number,
  verifyToken: string
): Promise<void> {

  await pool.query(Query.insertToken, [userId, verifyToken])

}

async function updateToken(
  userId: number,
  newToken: string
): Promise<void> {

  await pool.query(Query.updateToken, [userId, newToken])
}

async function deleteToken(
  userId: number
): Promise<void> {

  await pool.query(Query.deleteToken, [userId])
}

async function findVerifyData(
  verifyToken: string
): Promise<Verify | undefined> {
  const verifyData: QueryResult = await pool.query(Query.findVerifyData, [verifyToken])

  if (verifyData.rows.length === 0) {
    return undefined
  }

  return verifyData.rows[0]
}

export {
  findById,
  findVerifyData,
  findOne,
  createUser,
  verifyUser,
  insertToken,
  updateToken,
  deleteToken
}