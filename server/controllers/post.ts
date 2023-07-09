import { pool } from "../database/index"
import * as Query from "../database/queries"
import { HomePost, Post, Comment, Tags, RawComment } from "../database/Post"
import { QueryResult } from "pg"

/**
 * Creates a post with the associated user id and post contents
 * @param userId 
 * @param title Title of the post
 * @param desc Description of the post
 * @param audio The string encoded with the audio file's contents
 * @returns The ID associated with the created post
 */
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

/**
 * Creates a comment with the associated post id and user id
 * @param postId 
 * @param userId 
 * @param comment The comment writted by the user on the post
 */
async function createComment(
  postId: string,
  userId: number,
  comment: string
): Promise<void> {
  const newId = await pool.query(Query.createComment, [postId, userId, comment])
  return newId.rows[0].id
}

/**
 * Obtains a portion of every post which matches with the queries and filters
 * @param amount Amount of posts to be returned. Is bounded by the total number 
 * of posts returned with the specified query
 * @param searchQuery Matches with post titles which contain searchQuery
 * @param sortQuery Sorts posts based on time posted or amount of likes
 * @param tagsQuery Matches with posts which contain any tags in tagsQuery
 * @returns A highlight of every post obtained by the queries
 */
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

/**
 * Obtains the likes of a post
 * @param postId 
 * @returns Amount of likes associated with the post id
 */
async function getAllLikes(postId: string): Promise<number> {
  const allLikes = await pool.query(Query.getAllLikes, [postId])
  if (allLikes.length === 0) {
    throw new Error('Query Error: Unable to obtain likes for post')
  }
  const allActualLikes = parseInt(allLikes.rows[0].count)

  return allActualLikes
}

/**
 * Obtains the post represented by the post id
 * @param id 
 * @returns The full post associated with the id if post exists. Otherwise,
 * returns undefined
 */
async function findById(id: string): Promise<Post | undefined> {
  const getPost: QueryResult = await pool.query(Query.findPostById, [id])
  if (getPost.rows.length === 0) {
    return undefined
  }
  return getPost.rows[0]
}

/**
 * Obtains all comments from the post id
 * @param id 
 * @returns All comments associated with the id
 */
async function getComments(id: string): Promise<Comment[]> {
  const getComments: QueryResult = await pool.query(Query.getComments, [id])
  return getComments.rows
}

/**
 * Checks if the user has liked the post with their respective ids 
 * @param postId 
 * @param userId 
 * @returns True if user has liked post, false otherwise.
 */
async function userLikedPost(postId: string, userId: number): Promise<boolean> {
  const isLiked = await pool.query(Query.didUserLikePost, [userId, postId])
  if (isLiked.rows.length === 0) {
    return false
  }
  return true
}

/**
 * Registers a like on the post with user id
 * @param postId 
 * @param userId 
 */
async function likePost(postId: string, userId: number): Promise<void> {
  await pool.query(Query.createLike, [postId, userId])
}

/**
 * Unregisters like on the post with user id
 * @param postId 
 * @param userId 
 */
async function unlikePost(postId: string, userId: number): Promise<void> {
  await pool.query(Query.removeLike, [postId, userId])
}

/**
 * Updates the description of the post with the specified text
 * @param postId 
 * @param text The text content used to update the description
 */
async function updateDescription(postId: string, text: string): Promise<void> {
  await pool.query(Query.updateDescription, [text, postId])
}

//Might have to delete comment likes as well or replies if I add them
/**
 * Deletes all post data associated with the post id. Removes comments, likes,
 * and tags along with the main post.
 * @param postId 
 */
async function deletePost(postId: string): Promise<void> {
  await pool.query(Query.deletePost, [postId])
  await pool.query(Query.deleteComments, [postId])
  await pool.query(Query.deleteLikes, [postId])
  await pool.query(Query.deleteTags, [postId])
}

/**
 * Registers tags and associates them with post
 * @param postId 
 * @param tags Represents the tags specified by the post
 */
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

/**
 * Obtains all tags registered with the post id
 * @param postId 
 * @returns All tags associated with the post
 */
async function getTags(postId: string): Promise<Tags> {
  const tags: QueryResult = await pool.query(Query.getTags, [postId])

  if (tags.rows.length === 0) {
    await pool.query(Query.createDefaultTags, [postId])
    const newTags: QueryResult = await pool.query(Query.getTags, [postId])
    return newTags.rows[0]
  }

  return tags.rows[0]
}

/**
 * Obtains all identification information about comment
 * @param id
 * @returns Main identification of comment. Returns associated user and post id.
 */
async function findCommentById(
  id: string | number,
): Promise<RawComment | undefined> {
  const comment: QueryResult = await pool.query(Query.findCommentById, [id])
  if (comment.rows.length === 0) {
    return undefined
  }
  return comment.rows[0]
}

/**
 * Updates comment with new text
 * @param id Identification associated with comment
 * @param comment 
 */
async function updateComment(
  id: string | number,
  comment: string
): Promise<void> {
  await pool.query(Query.updateComment, [comment, id])

}

//If i add replies need to also delete them
async function deleteComment(
  id: string | number
): Promise<void> {
  await pool.query(Query.deleteComment, [id])
}

export {
  getPosts,
  getAllLikes,
  getTags,
  createPost,
  createTags,
  findById,
  findCommentById,
  getComments,
  userLikedPost,
  createComment,
  likePost,
  unlikePost,
  updateDescription,
  updateComment,
  deletePost,
  deleteComment
}

