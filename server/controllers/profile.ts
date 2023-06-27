import { pool } from "../database/index";
import * as Query from "../database/queries"
import { Profile } from "../database/Profile";
import { HomePost } from "../database/Post";

async function findById(userId: number): Promise<Profile | undefined> {
  const profile = await pool.query(Query.findProfileById, [userId])
  if (profile.rows.length === 0) {
    return undefined
  }
  return profile.rows[0]
}

async function createDefault(userId: number): Promise<void> {
  await pool.query(Query.createDefaultProfile, [userId])
}

async function updateContact(userId: number, text: string): Promise<void> {
  await pool.query(Query.updateContact, [userId, text])
}

async function updateBio(userId: number, text: string): Promise<void> {
  await pool.query(Query.updateBio, [userId, text])
}

async function getAllLikedPosts(userId: number): Promise<HomePost[]> {
  const posts = await pool.query(Query.getAllPostsFromLikes, [userId])
  return posts.rows
}

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