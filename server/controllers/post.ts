import { pool } from "../database/index"
import * as Query from "../database/queries"
import { HomePost } from "../database/Post"
import { QueryResult } from "pg"

async function createPost(
  username: string,
  title: string,
  desc: string,
  audio: string
): Promise<void> {

  await pool.query(Query.createPost, [username, title, desc, audio])
}

async function getPosts(amount: string): Promise<HomePost[]> {
  const firstPosts: QueryResult = await pool.query(Query.getPosts, [amount])
  return firstPosts.rows
}

export {
  getPosts,
  createPost
}

