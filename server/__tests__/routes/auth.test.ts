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

describe('inside of auth endpoint', () => {

  describe('when logging in', () => {
    it('should pass when username and password are correct', () => {
      (UserController.findOne as jest.Mock).mockReturnValue(fakeUser);
      (Encrypt.comparePassword as jest.Mock).mockReturnValue(true)

      user.post('/auth/login')
        .send({ username: 'admin', password: 'admin' })
        .expect(200)
    })

    it('should have a user object once authenticated', () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);

      user.post('/auth/authenticate').expect(200, {
        ...fakeUser
      })
    })
  })
})