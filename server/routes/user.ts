import { Router, Request, Response } from 'express'
import { User } from '../database/User'
import * as UserController from '../controllers/user'
import * as Profile from '../controllers/profile'
import { authorizeUpdateProfile } from '../utils/formAuth'
import { createToken } from '../utils/hash'
import { sendMail, verifyTimeSent } from '../utils/mail'
const router = Router()

const INTERNAL_ERR_MSG = [{ message: 'Something Went Wrong, Please Try Again' }]

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
    return res.status(500).send(INTERNAL_ERR_MSG)
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
      profile = {
        id: user.id,
        username: user.username,
        contact: '',
        bio: ''
      }
    }
    const allLikes = await Profile.getAllLikedPosts(user.id)
    const allPosts = await Profile.getAllPosts(user.id)

    res.status(200).send({
      ...profile,
      canModify,
      likes: allLikes,
      posts: allPosts,
      isVerified: user.verified
    })
  } catch (err) {
    console.log(err)
    res.status(500).send(INTERNAL_ERR_MSG)
  }
})

router.put('/:id/updateContact', async (req, res) => {
  await updateProfilePortion(req, res, CONTACT_TEXT_LENGTH, Profile.updateContact)
})

router.put('/:id/updateBio', async (req, res) => {
  await updateProfilePortion(req, res, BIO_TEXT_LENGTH, Profile.updateBio)
})

router.get('/:id/resendVerification', async (req, res) => {
  if (!('user' in req)) {
    return res.status(401).send([{ message: 'Must Be Logged In To Update Profile' }])
  }
  const userId = req.params.id
  const sessionUserId = (req.user as User).id

  try {
    const user = await UserController.findById(userId)

    if (!user) {
      return res.status(404).send([{ message: 'User Not Found' }])
    }

    if (user.id !== sessionUserId) {
      return res.status(401).send([{ message: 'Only Original User Can Resend Verification' }])
    }

    if (user.verified) {
      return res.status(400).send([{ message: 'User Is Already Verified' }])
    }

    const verifyData = await UserController.findVerifyDataById(user.id)
    const newToken = createToken()

    if (!verifyData) {
      await UserController.insertToken(user.id, newToken)
      await sendMail(user.email, newToken)
      return res.sendStatus(200)
    }

    if (!verifyTimeSent(verifyData.time_sent)) {
      await UserController.updateToken(user.id, newToken)
      await sendMail(user.email, newToken)
      return res.sendStatus(200)
    }

    await sendMail(user.email, verifyData.token)
    res.sendStatus(200)
  } catch (err) {
    console.log(err)
    res.status(500).send(INTERNAL_ERR_MSG)
  }
})

export default router

export {
  updateProfilePortion
}