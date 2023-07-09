import { Router, Request, Response } from 'express'
import { User } from '../database/User'
import * as UserController from '../controllers/user'
import * as Profile from '../controllers/profile'
import { authorizeUpdateProfile } from '../utils/formAuth'
const router = Router()

const CONTACT_TEXT_LENGTH = 50
const BIO_TEXT_LENGTH = 800

/**
 * Updates portion of profile with new information
 * @param req Request received by router
 * @param res Response received by router
 * @param textLength Maximum length for the updating text
 * @param updateFunction Serializes the text in the database with the user id
 */
async function updateProfilePortion(
  req: Request,
  res: Response,
  textLength: number,
  updateFunction: (id: number, text: string) => Promise<void>
): Promise<Response> {
  const userId = req.params.id
  const { text } = req.body
  if (!('user' in req)) {
    return res.status(401).send([{ message: 'Must Be Logged In To Update Profile' }])
  }

  if (!(req.user as User).verified) {
    return res.status(401).send([{ message: 'Must Be Verified To Update Profile' }])
  }
  const sessionUserId = (req.user as User).id

  try {
    const errors = await authorizeUpdateProfile(userId, sessionUserId, text, textLength)
    if (errors.length > 0) {
      return res.status(400).send(errors)
    }
    await updateFunction(sessionUserId, text)
    return res.sendStatus(200)
  } catch (err) {
    return res.sendStatus(500)
  }
}

router.get('/:id', async (req, res) => {
  const userId: string = req.params.id
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
  await updateProfilePortion(req, res, CONTACT_TEXT_LENGTH, Profile.updateContact)
})

router.put('/:id/updateBio', async (req, res) => {
  await updateProfilePortion(req, res, BIO_TEXT_LENGTH, Profile.updateBio)
})

export default router

export {
  updateProfilePortion
}