import express from 'express'
import session from 'express-session'
import passport from 'passport'
import authRoutes from '../routes/auth'
import postRoutes from '../routes/post'
import userRoutes from '../routes/user'
import cors from 'cors'

export function makeApp() {
  const app = express()

  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ limit: '2mb' }))

  app.use('/auth', authRoutes)
  app.use('/post', postRoutes)
  app.use('/user', userRoutes)

  return app
}

export function makeAppSession() {
  const app = express()

  app.use(cors())

  require('../strategy/local')

  app.use(express.json())
  app.use(express.urlencoded())

  app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: false
    }
  }))

  app.use(passport.initialize())
  app.use(passport.session())

  app.use('/auth', authRoutes)
  app.use('/post', postRoutes)
  app.use('/user', userRoutes)

  return app
}