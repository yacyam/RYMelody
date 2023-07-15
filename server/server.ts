import express from 'express'
import session from 'express-session'
import passport from 'passport'
import cors from 'cors'
import { pool } from './database/index'
require('dotenv').config()

const PORT = process.env.PORT || 3000

const pgSession = require('connect-pg-simple')(session)

const app = express()


app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

app.set("trust proxy", 1)

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
    sameSite: "none",
    secure: true,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}))

import authRoutes from './routes/auth'
import postRoutes from './routes/post'
import userRoutes from './routes/user'

app.use(passport.initialize())
app.use(passport.session())

app.use('/auth', authRoutes)
app.use('/post', postRoutes)
app.use('/user', userRoutes)

app.listen(PORT, () => console.log(`Server Listening on PORT ${PORT}`))

