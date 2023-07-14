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

/**
 * Verifies user profile for full website access
 * @param userId 
 */
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

/**
 * Updates unverified user with new token and refreshed token duration
 * @param userId 
 * @param newToken Token associated with user verification
 */
async function updateToken(
  userId: number,
  newToken: string
): Promise<void> {

  await pool.query(Query.updateToken, [userId, newToken])
}

/**
 * Deletes token associated with user
 * @param userId 
 */
async function deleteToken(
  userId: number
): Promise<void> {

  await pool.query(Query.deleteToken, [userId])
}

/**
 * Finds the data associated with verification token
 * @param verifyToken 
 * @returns Information about user and the time token was sent
 */
async function findVerifyData(
  verifyToken: string
): Promise<Verify | undefined> {
  const verifyData: QueryResult = await pool.query(Query.findVerifyData, [verifyToken])

  if (verifyData.rows.length === 0) {
    return undefined
  }

  return verifyData.rows[0]
}

/**
 * Obtains Verification Data From User ID
 * @param userId 
 * @returns Verification Data Associated With User
 */
async function findVerifyDataById(
  userId: number | string
): Promise<Verify | undefined> {

  const verifyData: QueryResult = await pool.query(Query.findVerifyDataById, [userId])

  if (verifyData.rows.length === 0) {
    return undefined
  }

  return verifyData.rows[0]
}

export {
  findById,
  findVerifyData,
  findVerifyDataById,
  findOne,
  createUser,
  verifyUser,
  insertToken,
  updateToken,
  deleteToken
}