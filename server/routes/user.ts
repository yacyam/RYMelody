import { Router, Request, Response } from 'express'
import { User } from '../database/User'
import * as UserController from '../controllers/user'
import * as Profile from '../controllers/profile'
import { authorizeUpdateProfile } from '../utils/formAuth'
const router = Router()

async function updateProfilePortion(
  req: Request,
  res: Response,
  textLength: number,
  updateFunction: (id: number, text: string) => Promise<void>
) {
  const id = parseInt(req.params.id)
  const { text } = req.body
  if (!('user' in req)) return res.sendStatus(401)
  const userId = (req.user as User).id

  try {
    const errors = await authorizeUpdateProfile(userId, userId, text, textLength)
    if (errors.length > 0) {
      return res.status(400).send(errors)
    }
    await updateFunction(id, text)
    return res.sendStatus(200)
  } catch (err) {
    return res.sendStatus(500)
  }
}

router.get('/:id', async (req, res) => {
  const userId = parseInt(req.params.id)
  try {
    const user = await UserController.findById(userId)
    if (!user) return res.sendStatus(404)

    let profile = await Profile.findById(user.id)
    const canModify = 'user' in req && (req.user as User).id === user.id

    if (!profile) {
      await Profile.createDefault(user.id)
      profile = { userid: user.id, username: user.username, contact: '', bio: '' }
    }
    const allLikes = await Profile.getAllLikedPosts(user.id)
    const allPosts = await Profile.getAllPosts(user.id)

    res.status(200).send({ ...profile, canModify, likes: allLikes, posts: allPosts })
  } catch (err) {
    res.sendStatus(500)
  }
})

router.put('/:id/updateContact', async (req, res) => {
  await updateProfilePortion(req, res, 50, Profile.updateContact)
})

router.put('/:id/updateBio', async (req, res) => {
  await updateProfilePortion(req, res, 800, Profile.updateBio)
})

export default router