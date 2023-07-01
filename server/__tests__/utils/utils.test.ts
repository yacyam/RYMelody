jest.mock('../../controllers/user')

import { jest, expect, describe, it } from '@jest/globals'
import makeApp from "../../utils/createApp";
import * as UserController from '../../controllers/user'
import { User, OptionalUser } from '../../database/User';
import * as Auth from '../../utils/formAuth'

const NOT_FILLED_ERROR = 'All Fields Must Be Filled In'

const fakeUser: User = {
  id: 1,
  username: 'abcde',
  email: 'abcdefgh',
  password: 'AKSOMCOXPZMCOPNEIOPNIOWPENFOEMKKNFCZNKWP'
}

const USERNAME = 'abcde'
const EMAIL = 'example@gmail.com'
const PASS = 'abcdefgh'
const CONF = 'abcdefgh'

afterEach(() => {
  jest.clearAllMocks()
})

type findOne = (arg: OptionalUser) => Promise<User | undefined>

describe('inside of form auth', () => {
  describe('when authorizing register form', () => {
    it('should fail when some field does not exist', async () => {
      jest.spyOn(Auth, 'authorizeRegisterForm')

      const res = [
        ['', 'example@gmail.com', 'abcdefgh', 'abcdefgh'],
        ['abc', '', 'abcdefgh', 'abcdefgh'],
        ['abc', 'example@gmail.com', '', 'abcdefgh'],
        ['abc', 'example@gmail.com', 'abcdefgh', '']
      ]
        .map(async ([username, email, password, confirm]) => {
          const errors =
            await Auth.authorizeRegisterForm(username, email, password, confirm)

          expect(errors.length).toEqual(1)
          expect(errors[0].message).toEqual(NOT_FILLED_ERROR)
          expect(UserController.findOne).toBeCalledTimes(0)
        })

      expect(Auth.authorizeRegisterForm).toBeCalledTimes(4)
    })

    it('should fail if the email already exists', async () => {
      (UserController.findOne as jest.Mock).mockImplementation(() => {
        return fakeUser
      })

      const errors = await Auth.authorizeRegisterForm(USERNAME, EMAIL, PASS, CONF)

      expect(errors.length).toEqual(1)
      expect(errors[0].message).toEqual('Email Already Registered, Try Logging In')
      expect(UserController.findOne).toBeCalledTimes(2)
    })

    it('should fail if the email exists but username does not', async () => {
      (UserController.findOne as jest.Mock<findOne>).mockImplementation(async data => {
        if (data.email) {
          return fakeUser
        }
        return undefined
      })

      const errors = await Auth.authorizeRegisterForm(USERNAME, EMAIL, PASS, CONF)

      expect(errors.length).toEqual(1)
      expect(errors[0].message).toEqual('Email Already Registered, Try Logging In')
      expect(UserController.findOne).toBeCalledTimes(2)
    })

    it('should fail if username exists but email does not', async () => {
      (UserController.findOne as jest.Mock<findOne>).mockImplementation(async data => {
        if (data.username) {
          return fakeUser
        }
        return undefined
      })

      const errors = await Auth.authorizeRegisterForm(USERNAME, EMAIL, PASS, CONF)

      expect(errors.length).toEqual(1)
      expect(errors[0].message).toEqual('Username Already Exists')
      expect(UserController.findOne).toBeCalledTimes(2)
    })
  })
})