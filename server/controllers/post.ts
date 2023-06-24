import { pool } from "../database/index"
import * as Query from "../database/queries"
import { HomePost, Post, Comment } from "../database/Post"
import { QueryResult } from "pg"

async function createPost(
  username: string,
  title: string,
  desc: string,
  audio: string
): Promise<void> {

  await pool.query(Query.createPost, [username, title, desc, audio])
}

async function createComment(
  postId: string,
  username: string,
  comment: string
): Promise<void> {
  await pool.query(Query.createComment, [postId, username, comment])
}

async function getPosts(amount: string): Promise<HomePost[]> {
  const firstPosts: QueryResult = await pool.query(Query.getPosts, [amount])
  return firstPosts.rows
}

async function findById(id: string): Promise<Post | undefined> {
  const getPost: QueryResult = await pool.query(Query.findPostById, [id])
  if (getPost.rows.length === 0) {
    return undefined
  }
  return getPost.rows[0]
}

async function findCommentsById(id: string): Promise<Comment[]> {
  const getComments: QueryResult = await pool.query(Query.findCommentsById, [id])
  return getComments.rows
}

export {
  getPosts,
  createPost,
  findById,
  findCommentsById,
  createComment
}

