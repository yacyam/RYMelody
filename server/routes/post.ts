import { Router } from "express";
import { authorizeCommentForm, authorizePostForm } from "../utils/formAuth";
import { User } from "../database/User";
import * as Post from "../controllers/post"
const router = Router()

router.post('/create', async (req, res) => {
  let userId: number = 0
  if ('user' in req) {
    userId = (req.user as User).id
  }
  const { title, desc, audio, audioSize } = req.body

  const errors = authorizePostForm(title, desc, audio, audioSize, userId)
  if (errors.length > 0) {
    res.status(400).send(errors)
  }
  else {
    await Post.createPost(userId, title, desc, audio)
  }
})

router.get('/all', async (req, res) => {
  let amountPosts = req.query.q
  if (typeof amountPosts !== 'string') {
    amountPosts = '10'
  }
  try {
    const allPosts = await Post.getPosts(amountPosts)
    res.status(200).send(allPosts)
  } catch (err) {
    res.sendStatus(500)
  }
})

router.get('/:id', async (req, res) => {
  const postId = req.params.id
  try {
    const post = await Post.findById(postId)
    if (!post) {
      return res.sendStatus(404)
    }
    const allComments = await Post.findCommentsById(postId)
    const allLikes = await Post.getAllLikes(postId)
    let isLikedByUser = false
    let canModify = false
    if ('user' in req) {
      const userId = (req.user as User).id
      isLikedByUser = await Post.userLikedPost(postId, userId)
      canModify = post.userid === userId
    }

    res.status(200).send({
      ...post,
      comments: allComments,
      amountLikes: allLikes,
      isPostLiked: isLikedByUser,
      canModify: canModify
    })
  } catch (err) {
    res.sendStatus(500)
  }
})

router.post('/comment', async (req, res) => {
  if (!('user' in req)) {
    return res.status(401).send([{ message: 'Must Be Logged In To Comment' }])
  }
  const userId = (req.user as User).id
  const { postId, comment } = req.body
  const errors = await authorizeCommentForm(postId, comment)
  if (errors.length > 0) {
    res.status(400).send(errors)
  }
  else {
    try {
      const generatedId = await Post.createComment(postId, userId, comment)
      const username = (req.user as User).username
      res.status(200).send({ id: generatedId, username: username })
    } catch (err) {
      res.sendStatus(500)
    }
  }
})

router.post('/:id/like', async (req, res) => {
  if (!('user' in req)) {
    return res.status(401).send([{ message: 'Must Be Logged In To Like Post' }])
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
    res.sendStatus(500)
  }
})

export default router