import { Router } from "express";
import { authorizePostForm } from "../utils/formAuth";
import { User } from "../database/User";
import * as Post from "../controllers/post"
const router = Router()

router.post('/create', async (req, res) => {
  const username = req.user ? (req.user as User).username : ""
  const { title, desc, audio, audioSize } = req.body

  const errors = authorizePostForm(title, desc, audio, audioSize, username)
  if (errors.length > 0) {
    res.status(400).send(errors)
  }
  else {
    await Post.createPost(username, title, desc, audio)
  }
})

router.get('/all', async (req, res) => {
  let amountPosts = req.query.q
  if (typeof amountPosts !== 'string') {
    amountPosts = '10'
  }
  try {
    const allPosts = await Post.getPosts(amountPosts)
    console.log(allPosts)
    res.status(200).send(allPosts)
  } catch (err) {
    res.sendStatus(500)
  }

})

export default router