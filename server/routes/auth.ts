import { Router } from "express";
import { hashPassword } from "../utils/hash";
import * as User from "../controllers/user"
import { authorizeRegisterForm } from "../utils/auth";
const router = Router()

router.get('/', (req, res) => {
  res.send('HI')
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

export default router
