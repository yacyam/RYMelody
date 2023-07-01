import express from 'express'
import session from 'express-session'
import passport from 'passport'
import cors from 'cors'
import { pool } from '../database/index'
import authRoutes from '../routes/auth'
import postRoutes from '../routes/post'
import userRoutes from '../routes/user'

export default function makeApp() {
  const app = express()

  require('../strategy/local')

  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ limit: '2mb' }))

  app.use('/auth', authRoutes)
  app.use('/post', postRoutes)
  app.use('/user', userRoutes)

  return app
}