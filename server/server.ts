const PORT = 3000
import express from 'express'
import session from 'express-session'
import passport from 'passport'
import cors from 'cors'
import { pool } from './database/index'
require('dotenv').config()

const pgSession = require('connect-pg-simple')(session)

const app = express()

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

require('./strategy/local')

app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ limit: '2mb' }))

app.use(session({
  secret: process.env.SESSION_SECRET || '',
  resave: false,
  saveUninitialized: false,
  store: new pgSession({
    pool: pool
  }),
  cookie: {
    secure: false
  }
}))

import authRoutes from './routes/auth'
import postRoutes from './routes/post'

app.use(passport.initialize())
app.use(passport.session())

app.use('/auth', authRoutes)
app.use('/post', postRoutes)

app.listen(PORT, () => console.log(`Server Listening on PORT ${PORT}`))

