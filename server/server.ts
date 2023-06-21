const PORT = 3000
import express from 'express'
import session from 'express-session'
import passport from 'passport'
import cors from 'cors'
require('dotenv').config()

const getFunc = require('connect-pg-simple')
const PostgresqlStore = getFunc(session)

const sessionStore = new PostgresqlStore({
  conString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
});

const app = express()

app.use(cors())

app.use(express.json())
app.use(express.urlencoded())

app.use(session({
  secret: process.env.SESSION_SECRET || '',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    sameSite: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}))

import authRoutes from './routes/auth'

app.use('/auth', authRoutes)

app.listen(PORT, () => console.log(`Server Listening on PORT ${PORT}`))

