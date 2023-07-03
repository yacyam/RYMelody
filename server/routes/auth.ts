import { Router } from "express";
import { hashPassword } from "../utils/hash";
import * as User from "../controllers/user"
import { authorizeRegisterForm } from "../utils/formAuth"
import passport from "passport";
const router = Router()

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
      await User.createUser(username, email, hashedPassword)
      res.sendStatus(200)
    }

  } catch (err) {
    res.sendStatus(500)
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

export default router
