require('dotenv').config()
import nodemailer from 'nodemailer'

const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_EMAIL,
    pass: process.env.MAIL_PASS
  }
})

function verifyTimeSent(date: Date) {
  const yesterdayDate = new Date().getTime() - (24 * 60 * 60 * 1000)
  const storedDate = date.getTime()
  return yesterdayDate <= storedDate
}

async function sendMail(email: string, token: string) {
  await transport.sendMail({
    from: process.env.MAIL_EMAIL,
    to: email,
    subject: 'Verify Account',
    html: `
    <div style="min-height: 100px;">
      Please Verify Your Email Address Here By Clicking The "Verify Email" Link.
      <br />
      <br />
      <a href="http://localhost:3000/auth/verify/${token}"
        style="text-decoration: none; color: white; background-color: #928aff; padding: 10px;">
        Verify Email
      </a>
    </div>
    `
  })
}

export {
  sendMail,
  verifyTimeSent
}