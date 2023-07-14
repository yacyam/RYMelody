require('dotenv').config()
import nodemailer from 'nodemailer'

const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_EMAIL,
    pass: process.env.MAIL_PASS
  }
})

/**
 * Determines Whether date Is Within 24 Hours Of Current Time.
 * @param date Date Verify Token Was Sent
 * @returns True If Token Date Is Within 24 Hours, False Otherwise
 */
function verifyTimeSent(date: Date): boolean {
  const yesterdayDate = new Date().getTime() - (24 * 60 * 60 * 1000)
  const storedDate = date.getTime()
  return yesterdayDate <= storedDate
}

/**
 * Sends Email To User With Verification Token
 * @param email Email Being Sent To
 * @param token Token For User Verification
 */
async function sendMail(email: string, token: string): Promise<void> {
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