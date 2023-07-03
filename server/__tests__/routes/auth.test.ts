jest.mock('../../controllers/user')
jest.mock('../../utils/hash')

import { jest, expect, describe, it, beforeAll } from '@jest/globals'
import { makeAppSession } from "../../utils/createApp";
import { Express } from 'express';
import * as UserController from '../../controllers/user'
import * as Encrypt from '../../utils/hash'
import request from 'supertest'

const fakeUser = {
  id: 1,
  username: 'abcde',
  email: 'abcdefgh',
  password: 'AKSOMCOXPZMCOPNEIOPNIOWPENFOEMKKNFCZNKWP'
}

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
  })
})