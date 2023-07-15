require('dotenv').config()
const { Pool } = require('pg')

const connectionString = `postgresql://${process.env.CLOUD_USER}:${process.env.CLOUD_PASSWORD}@${process.env.CLOUD_HOST}/${process.env.CLOUD_DATABASE}`

export const pool = new Pool({
  connectionString: connectionString
})