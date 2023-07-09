jest.mock('../../controllers/user')
jest.mock('../../utils/formAuth')
jest.mock('../../utils/hash')
jest.mock('../../utils/mail')

import { jest, expect, describe, it, beforeAll } from '@jest/globals'
import { makeAppSession } from "../../utils/createApp";
import { Express } from 'express';
import * as UserController from '../../controllers/user'
import * as Encrypt from '../../utils/hash'
import * as Auth from '../../utils/formAuth'
import * as Mail from '../../utils/mail'
import request from 'supertest'

const INTERNAL_ERR_MSG = [{ message: 'Something Went Wrong, Please Try Again' }]

const fakeUser = {
  id: 1,
  username: 'abcde',
  email: 'abcdefgh',
  password: 'AKSOMCOXPZMCOPNEIOPNIOWPENFOEMKKNFCZNKWP'
}

const verifyData = {
  userid: fakeUser.id,
  token: 'abc',
  time_sent: new Date()
}

const USERNAME = 'abcde'
const EMAIL = 'example@gmail.com'
const PASS = 'abcdefgh'
const CONF = 'abcdefgh'

const app: Express = makeAppSession()
let user: request.SuperAgentTest
beforeAll(() => {
  user = request.agent(app);
});

afterEach(() => {
  jest.clearAllMocks()
})

describe('inside of auth endpoint', () => {

  describe('when logging in', () => {
    it('should fail when username doesnt have associated user', async () => {
      (UserController.findOne as jest.Mock).mockReturnValue(undefined)

      const res = await user.post('/auth/login')
        .send({ username: 'abc', password: '123' })
        .type('json')

      expect(res.statusCode).toEqual(500)
      expect(UserController.findOne).toBeCalledTimes(1)
    })

    it('should fail if the password is incorrect for given user', async () => {
      (UserController.findOne as jest.Mock).mockReturnValue(fakeUser);
      (Encrypt.comparePassword as jest.Mock).mockReturnValue(false);

      const res = await user.post('/auth/login')
        .send({ username: 'abc', password: '123' })
        .type('json')
        .redirects(2)

      expect(res.statusCode).toEqual(401)
      expect(UserController.findOne).toBeCalledTimes(1)
      expect(Encrypt.comparePassword).toBeCalledTimes(1)
    })

    it('should not have user object if unauthenticated', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);

      const res = await user.get('/auth/authenticate')

      expect(res.status).toEqual(401)
      expect(res.body).toEqual({})
    })

    it('should pass when username and password are correct', async () => {
      (UserController.findOne as jest.Mock).mockReturnValue(fakeUser);
      (Encrypt.comparePassword as jest.Mock).mockReturnValue(true)

      const res = await user.post('/auth/login')
        .send({ username: 'abcde', password: '123' })
        .type('json')

      expect(res.status).toEqual(200)
      expect(UserController.findOne).toBeCalledTimes(1)
      expect(Encrypt.comparePassword).toBeCalledTimes(1)
    })


    it('should have a user object once authenticated', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);

      const res = await user.get('/auth/authenticate')

      expect(res.status).toEqual(200)
      expect(res.body).toEqual(fakeUser)
    })

    it('should logout properly after a successful login', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);

      const res = await user.post('/auth/logout')

      expect(res.status).toEqual(200)
      expect(UserController.findById).toBeCalledTimes(1)
    })

    it('should not have a user object property once logged out', async () => {
      const res = await user.get('/auth/authenticate')

      expect(res.status).toEqual(401)
    })
  })

  describe('when registering a user', () => {
    it('should fail if the form authorizes improperly', async () => {
      (Auth.authorizeRegisterForm as jest.Mock).mockReturnValue([{ message: 'Some Form Component Is Incorrect' }])

      const res = await request(app).post('/auth/register')

      expect(res.status).toEqual(400)
      expect(res.body).toEqual([{ message: 'Some Form Component Is Incorrect' }])
      expect(Auth.authorizeRegisterForm).toBeCalledTimes(1)
      expect(Auth.authorizeRegisterForm).toBeCalledWith(undefined, undefined, undefined, undefined)
    })

    it('should fail if the form check throws error', async () => {
      (Auth.authorizeRegisterForm as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await request(app).post('/auth/register')

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
    })

    it('should fail if creating a user fails', async () => {
      (UserController.createUser as jest.Mock).mockImplementation(() => {
        throw new Error('User Could Not Be Created')
      });
      (Auth.authorizeRegisterForm as jest.Mock).mockReturnValue([])

      const res = await request(app).post('/auth/register')

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(Auth.authorizeRegisterForm).toBeCalledTimes(1)
      expect(UserController.createUser).toBeCalledTimes(1)
    })

    it('should fail if inserting verification token fails', async () => {
      (UserController.createUser as jest.Mock).mockImplementation(() => { return });
      (Auth.authorizeRegisterForm as jest.Mock).mockReturnValue([]);
      (UserController.insertToken as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await request(app).post('/auth/register')

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(Auth.authorizeRegisterForm).toBeCalledTimes(1)
      expect(UserController.createUser).toBeCalledTimes(1)
      expect(UserController.insertToken).toBeCalledTimes(1)
    })

    it('should fail if sending mail fails', async () => {
      (Mail.sendMail as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await request(app).post('/auth/register')

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(Auth.authorizeRegisterForm).toBeCalledTimes(1)
      expect(UserController.createUser).toBeCalledTimes(1)
      expect(UserController.insertToken).toBeCalledTimes(1)
      expect(Mail.sendMail).toBeCalledTimes(1)
    })

    it('should pass if user is created successfully', async () => {
      const regForm = {
        username: USERNAME,
        email: EMAIL,
        password: PASS,
        confirmPassword: CONF
      };

      const res = await request(app).post('/auth/register').send(regForm)

      expect(res.status).toBe(200)
      expect(Auth.authorizeRegisterForm).toBeCalledTimes(1)
      expect(Auth.authorizeRegisterForm).toBeCalledWith(USERNAME, EMAIL, PASS, CONF)
      expect(UserController.createUser).toBeCalledTimes(1)
    })
  })

  describe('when verifying user', () => {
    it('should fail if getting verification token data throws error', async () => {
      (UserController.findVerifyData as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await request(app).get('/auth/verify/abc')

      expect(res.status).toBe(500)
      expect(res.text).toEqual(INTERNAL_ERR_MSG[0].message)
      expect(UserController.findVerifyData).toBeCalledTimes(1)
    })

    it('should fail if the verification token does not exist', async () => {
      (UserController.findVerifyData as jest.Mock).mockReturnValueOnce(undefined)

      const res = await request(app).get('/auth/verify/abc')

      expect(res.status).toBe(404)
      expect(res.text).toEqual('Token Does Not Exist')
      expect(UserController.findVerifyData).toBeCalledTimes(1)
    })

    it('should fail if finding the user by id throws error', async () => {
      (UserController.findVerifyData as jest.Mock).mockReturnValue(verifyData);
      (UserController.findById as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await request(app).get('/auth/verify/abc')

      expect(res.status).toBe(500)
      expect(res.text).toEqual(INTERNAL_ERR_MSG[0].message)
      expect(UserController.findVerifyData).toBeCalledTimes(1)
      expect(UserController.findById).toBeCalledTimes(1)
    })

    it('should fail if the user associated with token does not exist', async () => {
      (UserController.findById as jest.Mock).mockReturnValueOnce(undefined)

      const res = await request(app).get('/auth/verify/abc')

      expect(res.status).toBe(404)
      expect(res.text).toEqual('User Associated With Token Does Not Exist.')
      expect(UserController.findVerifyData).toBeCalledTimes(1)
      expect(UserController.findById).toBeCalledTimes(1)
    })

    it('should fail if verify token expired and updating token fails', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);
      (Mail.verifyTimeSent as jest.Mock).mockReturnValue(false);
      (UserController.updateToken as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await request(app).get('/auth/verify/abc')

      expect(res.status).toBe(500)
      expect(res.text).toEqual(INTERNAL_ERR_MSG[0].message)
      expect(UserController.findById).toBeCalledTimes(1)
      expect(Mail.verifyTimeSent).toBeCalledTimes(1)
      expect(UserController.updateToken).toBeCalledTimes(1)
    })

    it('should fail if verify token expired and sending mail fails', async () => {
      (Mail.sendMail as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await request(app).get('/auth/verify/abc')

      expect(res.status).toBe(500)
      expect(res.text).toEqual(INTERNAL_ERR_MSG[0].message)
      expect(UserController.findById).toBeCalledTimes(1)
      expect(Mail.verifyTimeSent).toBeCalledTimes(1)
      expect(UserController.updateToken).toBeCalledTimes(1)
      expect(Mail.sendMail).toBeCalledTimes(1)
    })

    it('should fail with bad request if verify token expired', async () => {
      const res = await request(app).get('/auth/verify/abc')

      expect(res.status).toBe(400)
      expect(res.text).toEqual('Verification Link Expired, New Verification Link Sent')
      expect(UserController.findById).toBeCalledWith(verifyData.userid)
      expect(Mail.verifyTimeSent).toBeCalledWith(verifyData.time_sent)
      expect(UserController.updateToken).toBeCalledTimes(1)
      expect(Mail.sendMail).toBeCalledTimes(1)
    })

    it('should fail if verify token valid but verifying the user throws error', async () => {
      (Mail.verifyTimeSent as jest.Mock).mockReturnValue(true);
      (UserController.verifyUser as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await request(app).get('/auth/verify/abc')

      expect(res.status).toBe(500)
      expect(res.text).toEqual(INTERNAL_ERR_MSG[0].message)
      expect(UserController.verifyUser).toBeCalledTimes(1)
      expect(UserController.verifyUser).toBeCalledWith(fakeUser.id)
    })

    it('should fail if verify token valid but deleting the token fails', async () => {
      (UserController.deleteToken as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await request(app).get('/auth/verify/abc')

      expect(res.status).toBe(500)
      expect(res.text).toEqual(INTERNAL_ERR_MSG[0].message)
      expect(UserController.verifyUser).toBeCalledTimes(1)
      expect(UserController.verifyUser).toBeCalledWith(fakeUser.id)
      expect(UserController.deleteToken).toBeCalledTimes(1)
      expect(UserController.deleteToken).toBeCalledWith(fakeUser.id)
    })

    it('should pass if user verification fully passes', async () => {
      const res = await request(app).get('/auth/verify/abcde')

      expect(res.status).toBe(200)
      expect(res.text).toEqual('You Are Now Verified')
      expect(UserController.verifyUser).toBeCalledTimes(1)
      expect(UserController.verifyUser).toBeCalledWith(fakeUser.id)
      expect(UserController.deleteToken).toBeCalledTimes(1)
      expect(UserController.deleteToken).toBeCalledWith(fakeUser.id)
    })
  })
})