import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import * as User from "../controllers/user"
import { comparePassword } from '../utils/hash';

passport.serializeUser((user: { id?: number }, done) => {
  console.log('serializing user...')
  if (!user.id) {
    return done(new Error('ID is undefined'))
  }
  console.log(user.id)
  done(null, user.id)
})

passport.deserializeUser(async (id: number, done) => {
  console.log('deserializing user...')
  try {
    const user = await User.findById(id)
    if (!user) {
      throw new Error('User Does Not Exist')
    }
    done(null, user)
  } catch (err) {
    done(err)
  }

})

passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
},
  async function (username, password, done) {
    try {
      console.log('logging in...')
      const user = await User.findOne({ username: username })
      console.log(user)
      if (!user) {
        throw new Error('User Does Not Exist')
      }

      if (!comparePassword(password, user.password)) {
        return done(null, false)
      }
      return done(null, user)

    } catch (err) {
      return done(err)
    }
  }
));


