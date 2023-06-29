import { Router } from "express";
import { authorizeCommentForm, authorizePostForm, authorizeUpdateForm } from "../utils/formAuth";
import { User } from "../database/User";
import * as Post from "../controllers/post"
const router = Router()

router.post('/create', async (req, res) => {
  let userId = 0
  if ('user' in req) {
    userId = (req.user as User).id
  }
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
      res.sendStatus(500)
    }
  }
})

router.get('/all', async (req, res) => {
  let amountPosts = req.query.q
  const { search, newest, oldest, likes } = req.query
  console.log(amountPosts, search, newest, oldest, likes)
  if (typeof amountPosts !== 'string') {
    amountPosts = '10'
  }
  const searchQuery: string = typeof search === 'string' ? search : ""
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
    const allPosts = await Post.getPosts(amountPosts, searchQuery, sortQuery)
    res.status(200).send(allPosts)
  } catch (err) {
    console.log(err)
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
    const allTags = await Post.getTags(postId)
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
      tags: allTags,
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
      res.status(200).send({ id: generatedId, userId, username: username })
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

router.put('/:id/update', async (req, res) => {
  const { text } = req.body
  const postId = req.params.id
  if (!('user' in req)) {
    return res.status(401).send([{ message: 'Only Original Poster Can Edit This Post' }])
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
    res.sendStatus(500)
  }
})

router.delete('/:id', async (req, res) => {
  const postId = req.params.id
  if (!('user' in req)) {
    return res.status(401).send([{ message: 'Only Original Poster Can Edit This Post' }])
  }
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
    res.sendStatus(500)
  }
})

export default router