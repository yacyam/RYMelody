import { pool } from "../database/index";
import * as Query from "../database/queries"
import { Profile } from "../database/Profile";
import { HomePost } from "../database/Post";

/**
 * Obtains the full profile associated with the user id
 * @param userId 
 * @returns Full profile of user if exists, otherwise returns undefined
 */
async function findById(userId: number): Promise<Profile | undefined> {
  const profile = await pool.query(Query.findProfileById, [userId])
  if (profile.rows.length === 0) {
    return undefined
  }
  return profile.rows[0]
}

/**
 * Creates default profile with placeholder bio information
 * @param userId 
 */
async function createDefault(userId: number): Promise<void> {
  await pool.query(Query.createDefaultProfile, [userId])
}

/**
 * Updates the profile of user with new contact information
 * @param userId 
 * @param text Updated contact text
 */
async function updateContact(userId: number, text: string): Promise<void> {
  await pool.query(Query.updateContact, [userId, text])
}

/**
 * Updates the profile of user with new bio information
 * @param userId 
 * @param text Updated bio text
 */
async function updateBio(userId: number, text: string): Promise<void> {
  await pool.query(Query.updateBio, [userId, text])
}

/**
 * Obtains all liked posts associated with the user id
 * @param userId 
 * @returns A highlight of every post liked by user
 */
async function getAllLikedPosts(userId: number): Promise<HomePost[]> {
  const posts = await pool.query(Query.getAllPostsFromLikes, [userId])
  return posts.rows
}

/**
 * Obtains all posts with the user id
 * @param userId 
 * @returns A highlight of every post by user
 */
async function getAllPosts(userId: number): Promise<HomePost[]> {
  const posts = await pool.query(Query.getAllPosts, [userId])
  return posts.rows
}

export {
  findById,
  createDefault,
  updateContact,
  updateBio,
  getAllLikedPosts,
  getAllPosts
}