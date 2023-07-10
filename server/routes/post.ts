import { NextFunction, Request, Response, Router } from "express";
import { authorizeCommentForm, authorizePostForm, authorizeReplyForm, authorizeUpdateComment, authorizeUpdateForm } from "../utils/formAuth";
import { User } from "../database/User";
import * as Post from "../controllers/post"
import { Comment, ModifyComment } from "../database/Post";
const router = Router()

const INTERNAL_ERR_MSG = [{ message: 'Something Went Wrong, Please Try Again' }]

/**
 * Updates each comment to see if current user logged in can edit/delete it.
 * @param comments Obtained comments from post
 * @param userId The id of the user in session
 * @returns Original comments with whether the current user in session can
 * modify it
 */
function checkIfModifiable(
  comments: Comment[],
  userId?: number
): ModifyComment[] {

  const checkModify: ModifyComment[] = comments.map((comment) => {
    const isModifiable = comment.userid === userId

    const modifiedComment: ModifyComment = {
      ...comment,
      canModify: isModifiable
    }

    return modifiedComment
  });

  return checkModify
}

router.post('/create', async (req, res) => {
  if (!('user' in req)) {
    return res.status(401).send([{ message: 'Must Be Signed In To Create Post' }])
  }
  if (!(req.user as User).verified) {
    return res.status(401).send([{ message: 'Must Be Verified To Create Post' }])
  }
  const userId = (req.user as User).id
  const { title, desc, audio, audioSize, tags } = req.body

  const errors = authorizePostForm(title, desc, audio, audioSize, tags, userId)
  if (errors.length > 0) {
    res.status(400).send(errors)
  }
  else {
    try {
      const postId = await Post.createPost(userId, title, desc, audio)
      await Post.createTags(postId, tags)
      res.sendStatus(200)
    } catch (err) {
      res.status(500).send(INTERNAL_ERR_MSG)
    }
  }
})

router.get('/all', async (req, res) => {
  let amountPosts = (req.query.q as string)
  const searchQuery = (req.query.search as string)
  const tagQuery = (req.query.tags as undefined | string | string[])
  const { newest, oldest, likes } = req.query

  let sortQuery = ""
  if (newest === 'true') {
    sortQuery = "DESC"
  }
  else if (oldest === 'true') {
    sortQuery = "ASC"
  }
  else if (likes === 'true') {
    sortQuery = "LIKES"
  }
  try {
    const allPosts = await Post.getPosts(amountPosts, searchQuery, sortQuery, tagQuery)
    res.status(200).send(allPosts)
  } catch (err) {
    res.status(500).send(INTERNAL_ERR_MSG)
  }
})

router.get('/:id', async (req, res) => {
  let userId: number | undefined = undefined;
  const postId = req.params.id
  try {
    const post = await Post.findById(postId)
    if (!post) {
      return res.sendStatus(404)
    }
    const allComments = await Post.getComments(postId)
    const allLikes = await Post.getAllLikes(postId)
    const allTags = await Post.getTags(postId)
    let isLikedByUser = false
    let canModify = false
    if ('user' in req) {
      userId = (req.user as User).id
      isLikedByUser = await Post.userLikedPost(postId, userId)
      canModify = post.userid === userId
    }

    const allCommentsModCheck = checkIfModifiable(allComments, userId)

    res.status(200).send({
      ...post,
      comments: allCommentsModCheck,
      tags: allTags,
      amountLikes: allLikes,
      isPostLiked: isLikedByUser,
      canModify: canModify
    })
  } catch (err) {
    res.status(500).send(INTERNAL_ERR_MSG)
  }
})

router.post('/:id/comment', async (req, res) => {
  if (!('user' in req)) {
    return res.status(401).send([{ message: 'Must Be Logged In To Post Comment' }])
  }
  if (!(req.user as User).verified) {
    return res.status(401).send([{ message: 'Must Be Verified To Post Comment' }])
  }
  const userId = (req.user as User).id
  const postId = req.params.id
  const { comment } = req.body
  const errors = await authorizeCommentForm(postId, comment)
  if (errors.length > 0) {
    res.status(400).send(errors)
  }
  else {
    try {
      const generatedId = await Post.createComment(postId, userId, comment)
      const username = (req.user as User).username
      res.status(200).send({ id: generatedId, userId, username: username })
    } catch (err) {
      res.status(500).send(INTERNAL_ERR_MSG)
    }
  }
})

router.put('/:id/comment', async (req, res) => {
  if (!('user' in req)) {
    return res.status(401).send([{ message: 'Must Be Logged In To Edit Comment' }])
  }
  if (!(req.user as User).verified) {
    return res.status(401).send([{ message: 'Must Be Verified To Edit Comment' }])
  }
  const commentId = req.body.id
  const { userId, comment } = req.body
  const postId = req.params.id
  const sessionUserId = (req.user as User).id

  try {
    const errors = await authorizeUpdateComment(userId, sessionUserId, commentId, postId, comment)

    if (errors.length > 0) {
      return res.status(400).send(errors)
    }
    await Post.updateComment(commentId, comment)
    res.sendStatus(200)
  } catch (err) {
    res.status(500).send(INTERNAL_ERR_MSG)
  }

})

router.post('/:id/like', async (req, res) => {
  if (!('user' in req)) {
    return res.status(401).send([{ message: 'Must Be Logged In To Like Post' }])
  }
  if (!(req.user as User).verified) {
    return res.status(401).send([{ message: 'Must Be Verified To Like Post' }])
  }
  const postId = req.params.id
  const userId = (req.user as User).id
  try {
    const isLiked = await Post.userLikedPost(postId, userId)
    if (isLiked) {
      await Post.unlikePost(postId, userId)
      return res.status(200).send('unliked')
    }

    await Post.likePost(postId, userId)
    res.status(200).send('liked')
  } catch (err) {
    res.status(500).send(INTERNAL_ERR_MSG)
  }
})

router.put('/:id/update', async (req, res) => {
  const { text } = req.body
  const postId = req.params.id
  if (!('user' in req)) {
    return res.status(401).send([{ message: 'Only Original Poster Can Edit This Post' }])
  }
  if (!(req.user as User).verified) {
    return res.status(401).send([{ message: 'Must Be Verified To Edit Post' }])
  }
  const userId = (req.user as User).id

  try {
    const errors = await authorizeUpdateForm(userId, postId, text)
    if (errors.length > 0) {
      return res.status(400).send(errors)
    }
    await Post.updateDescription(postId, text)
    res.sendStatus(200)
  } catch (err) {
    res.status(500).send(INTERNAL_ERR_MSG)
  }
})

router.delete('/:id', async (req, res) => {
  if (!('user' in req)) {
    return res.status(401).send([{ message: 'Only Original Poster Can Edit This Post' }])
  }
  if (!(req.user as User).verified) {
    return res.status(401).send([{ message: 'Must Be Verified To Delete Post' }])
  }
  const postId = req.params.id
  const userId = (req.user as User).id
  try {
    const post = await Post.findById(postId)
    if (!post) {
      return res.sendStatus(404)
    }
    if (post.userid !== userId) {
      return res.status(401).send([{ message: 'Only Original Poster Can Delete This Post' }])
    }
    await Post.deletePost(postId)
    res.sendStatus(200)
  } catch (err) {
    res.status(500).send(INTERNAL_ERR_MSG)
  }
})

router.delete('/:id/comment', async (req, res) => {
  if (!('user' in req)) {
    return res.status(401).send([{ message: 'Only Original Commenter Can Delete Comment' }])
  }
  if (!(req.user as User).verified) {
    return res.status(401).send([{ message: 'Must Be Verified To Delete Comment' }])
  }
  const userId = (req.user as User).id
  const postId = req.params.id
  const commentId = req.body.id
  try {
    const comment = await Post.findCommentById(commentId)
    if (!comment) {
      return res.status(400).send([{ message: 'Comment Does Not Exist' }])
    }
    if (userId !== comment.userid) {
      return res.status(401).send([{ message: 'Only Original Commenter Can Delete Comment' }])
    }
    if (postId !== `${comment.postid}`) {
      return res.status(400).send([{ message: 'Deleting Comment From Another Post' }])
    }
    await Post.deleteComment(commentId)
    res.sendStatus(200)
  } catch (err) {
    res.status(500).send(INTERNAL_ERR_MSG)
  }

})

router.post('/:id/reply', async (req, res) => {
  if (!('user' in req)) {
    res.status(401).send([{ message: 'Must Be Logged In To Reply' }])
  }
  const userId = (req.user as User).id
  const { commentId, replyId, reply, isMainCommentReply } = req.body
  const postId = req.params.id

  try {
    const errors = await authorizeReplyForm(commentId, replyId, postId, reply, isMainCommentReply)

    if (errors.length > 0) {
      return res.status(400).send(errors)
    }

    const newReplyId = await Post.createReply(userId, commentId, replyId, postId, reply)
    const username = (req.user as User).username
    res.status(200).send({ newReplyId, userId, username })
  } catch (err) {
    res.status(500).send(INTERNAL_ERR_MSG)
  }
})

export {
  checkIfModifiable
}

export default router