import { Router } from "express";
import { createToken, hashPassword } from "../utils/hash";
import * as User from "../controllers/user"
import { authorizeRegisterForm } from "../utils/formAuth"
import passport from "passport";
import { sendMail, verifyTimeSent } from "../utils/mail";
const router = Router()

const INTERNAL_ERR_MSG = [{ message: 'Something Went Wrong, Please Try Again' }]

router.get('/login_failure', (req, res) => {
  console.log('failed')
  res.sendStatus(401)
})

router.post('/login',
  passport.authenticate('local', { failureRedirect: '/auth/login_failure' }),
  (req, res) => {
    res.sendStatus(200)
  })

router.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body
  try {
    const errors = await authorizeRegisterForm(username, email, password, confirmPassword)

    if (errors.length > 0) {
      res.status(400).send(errors)
    }
    else {
      const hashedPassword = hashPassword(password)
      const verifyToken = createToken()
      const userId = await User.createUser(username, email, hashedPassword)
      await User.insertToken(userId, verifyToken)
      await sendMail(email, verifyToken)
      res.sendStatus(200)
    }

  } catch (err) {
    res.status(500).send(INTERNAL_ERR_MSG)
  }
})

router.get('/authenticate', (req, res) => {
  if (req.user) {
    res.status(200).send(req.user)
  }
  else {
    res.sendStatus(401)
  }
})

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err)
    res.sendStatus(200)
  })
})

router.get('/verify/:token', async (req, res) => {
  const { token } = req.params

  try {
    const verifyData = await User.findVerifyData(token)
    if (!verifyData) {
      return res.status(400).send('Token Does Not Exist')
    }
    const dateStored = verifyData.time_sent
    const user = await User.findById(verifyData.userid)
    if (!user) {
      return res.status(401).send('User Associated With Token Does Not Exist.')
    }
    if (!verifyTimeSent(dateStored)) {
      const newToken = createToken()
      await User.updateToken(user.id, newToken)
      await sendMail(user.email, newToken)

      res.status(400).send('Verification Link Expired, New Verification Link Sent')
      return
    }

    await User.verifyUser(user.id)
    await User.deleteToken(user.id)

    res.status(200).send('You Are Now Verified')
  } catch (err) {
    res.status(500).send('Something Went Wrong, Please Try Again')
  }
})

export default router
