import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import * as User from "../controllers/user"
import { comparePassword } from '../utils/hash';

passport.serializeUser((user: { id?: number }, done) => {
  console.log('serializing user...')
  done(null, user.id)
})

passport.deserializeUser(async (id: number, done) => {
  console.log('deserializing user...')
  try {
    const user = User.findById(id)
    if (!user) {
      throw new Error('User Does Not Exist')
    }
    console.log(user)
    done(null, user)
  } catch (err) {
    done(err)
  }

})



passport.use(new LocalStrategy(
  async function (username, password, done) {
    try {
      console.log('logging in...')
      const user = await User.findOne({ username: username })
      if (!user) {
        throw new Error('User Does Not Exist')
      }

      if (!comparePassword(password, user.password)) {
        return done(null, false)
      }
      return done(null, user)

    } catch (err) {
      done(err)
    }
  }
));


