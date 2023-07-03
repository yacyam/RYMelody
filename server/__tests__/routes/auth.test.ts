jest.mock('../../controllers/user')
jest.mock('../../utils/formAuth')
jest.mock('../../utils/hash')

import { jest, expect, describe, it, beforeAll } from '@jest/globals'
import { makeAppSession } from "../../utils/createApp";
import { Express } from 'express';
import * as UserController from '../../controllers/user'
import * as Encrypt from '../../utils/hash'
import * as Auth from '../../utils/formAuth'
import request from 'supertest'

const fakeUser = {
  id: 1,
  username: 'abcde',
  email: 'abcdefgh',
  password: 'AKSOMCOXPZMCOPNEIOPNIOWPENFOEMKKNFCZNKWP'
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

    it('should fail if creating a user fails', async () => {
      (UserController.createUser as jest.Mock).mockImplementation(() => {
        throw new Error('User Could Not Be Created')
      });
      (Auth.authorizeRegisterForm as jest.Mock).mockReturnValue([])

      const res = await request(app).post('/auth/register')

      expect(res.status).toEqual(500)
      expect(Auth.authorizeRegisterForm).toBeCalledTimes(1)
      expect(UserController.createUser).toBeCalledTimes(1)
    })

    it('should pass if user is created successfully', async () => {
      const regForm = {
        username: USERNAME,
        email: EMAIL,
        password: PASS,
        confirmPassword: CONF
      };

      (UserController.createUser as jest.Mock).mockImplementation(() => { return });
      (Auth.authorizeRegisterForm as jest.Mock).mockReturnValue([])

      const res = await request(app).post('/auth/register').send(regForm)

      expect(res.status).toEqual(200)
      expect(Auth.authorizeRegisterForm).toBeCalledTimes(1)
      expect(Auth.authorizeRegisterForm).toBeCalledWith(USERNAME, EMAIL, PASS, CONF)
      expect(UserController.createUser).toBeCalledTimes(1)
    })
  })
})