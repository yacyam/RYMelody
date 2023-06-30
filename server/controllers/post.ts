import { pool } from "../database/index"
import * as Query from "../database/queries"
import { HomePost, Post, Comment, Tags } from "../database/Post"
import { QueryResult } from "pg"

async function createPost(
  userId: number,
  title: string,
  desc: string,
  audio: string
): Promise<string> {

  const postId = await pool.query(Query.createPost, [userId, title, desc, audio])
  const { id } = postId.rows[0]
  return `${id}`
}

async function createComment(
  postId: string,
  userId: number,
  comment: string
): Promise<void> {
  await pool.query(Query.createComment, [postId, userId, comment])
  const newId = await pool.query(Query.getCommentId, [postId, userId])
  return newId.rows[0]
}

async function getPosts(
  amount: string,
  searchQuery: string,
  sortQuery: string,
  tagsQuery: undefined | string | string[]
): Promise<HomePost[]> {
  const wrapTags = typeof tagsQuery === 'string' ? [tagsQuery] : tagsQuery
  let generatedPostQuery = Query.createSearchQuery(sortQuery, wrapTags)
  const firstPosts: QueryResult = await pool.query(generatedPostQuery, [amount, searchQuery])
  return firstPosts.rows
}

async function getAllLikes(postId: string): Promise<number> {
  const allLikes = await pool.query(Query.getAllLikes, [postId])
  if (allLikes.length === 0) {
    throw new Error('Query Error: Unable to obtain likes for post')
  }
  const allActualLikes = parseInt(allLikes.rows[0].count)

  return allActualLikes
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

async function userLikedPost(postId: string, userId: number): Promise<boolean> {
  const isLiked = await pool.query(Query.didUserLikePost, [userId, postId])
  if (isLiked.rows.length === 0) {
    return false
  }
  return true
}

async function likePost(postId: string, userId: number): Promise<void> {
  await pool.query(Query.createLike, [postId, userId])
}

async function unlikePost(postId: string, userId: number): Promise<void> {
  await pool.query(Query.removeLike, [postId, userId])
}

async function updateDescription(postId: string, text: string): Promise<void> {
  await pool.query(Query.updateDescription, [text, postId])
}

//Might have to delete comment likes as well or replies if I add them
async function deletePost(postId: string): Promise<void> {
  await pool.query(Query.deletePost, [postId])
  await pool.query(Query.deleteComments, [postId])
  await pool.query(Query.deleteLikes, [postId])
  await pool.query(Query.deleteTags, [postId])
}

async function createTags(postId: string, tags: Tags): Promise<void> {
  await pool.query(Query.createTags,
    [
      postId,
      tags.electronic,
      tags.hiphop,
      tags.pop,
      tags.rock,
      tags.punk,
      tags.metal,
      tags.jazz,
      tags.classical
    ]
  )
}

async function getTags(postId: string): Promise<Tags> {
  const tags: QueryResult = await pool.query(Query.getTags, [postId])

  if (tags.rows.length === 0) {
    await pool.query(Query.createDefaultTags, [postId])
    const newTags: QueryResult = await pool.query(Query.getTags, [postId])
    return newTags.rows[0]
  }

  return tags.rows[0]
}

export {
  getPosts,
  getAllLikes,
  getTags,
  createPost,
  createTags,
  findById,
  findCommentsById,
  userLikedPost,
  createComment,
  likePost,
  unlikePost,
  updateDescription,
  deletePost
}

