jest.mock('../../controllers/user')
jest.mock('../../utils/hash')
jest.mock('../../utils/mail')

import { Request, Response } from 'express'
import { jest, expect, describe, it } from '@jest/globals'
import { Profile } from '../../database/Profile';
import { makeApp, makeAppSession } from "../../utils/createApp";
import request from 'supertest'
import * as UserController from '../../controllers/user'
import * as ProfileController from '../../controllers/profile'
import * as Encrypt from '../../utils/hash'
import * as Mail from '../../utils/mail'
import { updateProfilePortion } from '../../routes/user'
import { HomePost } from '../../database/Post';
import { Verify } from '../../database/User'


const INTERNAL_ERR_MSG = [{ message: 'Something Went Wrong, Please Try Again' }]

const app = makeApp()
const server = makeAppSession()
let user: request.SuperAgentTest

const fakeUser = {
  id: 1,
  username: 'abcde',
  email: 'abcdefgh',
  password: 'AKSOMCOXPZMCOPNEIOPNIOWPENFOEMKKNFCZNKWP',
  verified: true
}

const unverifiedUser = {
  ...fakeUser,
  verified: false
}

const fakeProfile = {
  id: 1,
  username: 'abcde',
  contact: 'abc@example.com',
  bio: 'abcdefgh'
}

const fakePost = {
  id: 1,
  userid: 1,
  username: "abcdefg",
  title: "abcde",
  description: "abcde",
}

const fakeVerifyData: Verify = {
  userid: fakeUser.id,
  token: "abcde",
  time_sent: new Date()
}

const REQ = {
  params: {
    id: "1"
  },
  body: {
    text: "abcde"
  }
} as unknown as Request

const RES = {
  send: jest.fn().mockReturnThis(),
  status: jest.fn().mockReturnThis(),
  sendStatus: jest.fn()
} as unknown as Response

beforeAll(async () => {
  user = request.agent(server);

  (UserController.findOne as jest.Mock).mockReturnValue(fakeUser);
  (Encrypt.comparePassword as jest.Mock).mockReturnValue(true);

  await user.post('/auth/login')
    .send({ username: 'abcde', password: '123' })
    .type('json')
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('inside of user endpoint', () => {
  describe('when updating profile portion', () => {
    const updateProfileFunc = jest.fn(async (id: number, text: string) => { return })
    const REQUSER = {
      ...REQ,
      user: fakeUser
    } as unknown as Request
    const anotherUser = { ...fakeUser, id: 5 }

    it('should fail if user is not serialized inside of session', async () => {
      await updateProfilePortion(REQ, RES, 10, updateProfileFunc)

      expect(RES.status).toBeCalledTimes(1)
      expect(RES.status).toBeCalledWith(401)
    })

    it('should fail if user is not verified', async () => {
      const unverifiedReq = {
        ...REQ,
        user: {
          ...fakeUser,
          verified: false
        }
      } as unknown as Request

      await updateProfilePortion(unverifiedReq, RES, 10, updateProfileFunc)

      expect(RES.status).toBeCalledTimes(1)
      expect(RES.status).toBeCalledWith(401)
      expect(RES.send).toBeCalledTimes(1)
      expect(RES.send).toBeCalledWith([{ message: 'Must Be Verified To Update Profile' }])
    })

    it('should fail if text length desired is smaller than body text', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser)
      await updateProfilePortion(REQUSER, RES, 4, updateProfileFunc)

      expect(RES.status).toBeCalledTimes(1)
      expect(RES.status).toBeCalledWith(400)
      expect(RES.send).toBeCalledTimes(1)
      expect(RES.send).toBeCalledWith([{ message: 'Inputted Text Length Must Be At Most 4 Characters' }])
    })

    it('should fail if user in session is not same as profile updating', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(anotherUser)
      await updateProfilePortion(REQUSER, RES, 4, updateProfileFunc)

      expect(RES.status).toBeCalledTimes(1)
      expect(RES.status).toBeCalledWith(400)
      expect(RES.send).toBeCalledTimes(1)
      expect(RES.send).toBeCalledWith([{ message: 'Must Be Signed In As User to Update Profile' }])
    })

    it('should pass if all fields are in desired range', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser)
      await updateProfilePortion(REQUSER, RES, 10, updateProfileFunc)

      expect(RES.sendStatus).toBeCalledTimes(1)
      expect(RES.sendStatus).toBeCalledWith(200)
      expect(updateProfileFunc).toBeCalledTimes(1)
      expect(updateProfileFunc).toBeCalledWith(1, "abcde")
    })
  })

  describe('when getting a specific user id', () => {
    jest.spyOn(ProfileController, 'createDefault')
    jest.spyOn(ProfileController, 'findById')
    jest.spyOn(ProfileController, 'getAllLikedPosts')
    jest.spyOn(ProfileController, 'getAllPosts')

    function mockAllProfile(profile: Profile | undefined, liked: HomePost[], made: HomePost[]) {
      (ProfileController.findById as jest.Mock).mockReturnValue(profile);
      (ProfileController.getAllLikedPosts as jest.Mock).mockReturnValue(liked);
      (ProfileController.getAllPosts as jest.Mock).mockReturnValue(made);
      (ProfileController.createDefault as jest.Mock).mockReturnValue(undefined);
    }

    it('should fail if user does not exist', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(undefined)
      const res = await request(app).get('/user/0')

      expect(res.statusCode).toEqual(404)
    })

    it('should create a default profile if profile does not exist', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);
      mockAllProfile(undefined, [], [])

      await request(app).get('/user/1').expect(200, {
        id: fakeUser.id,
        username: fakeUser.username,
        contact: '',
        bio: '',
        canModify: false,
        likes: [],
        posts: [],
        isVerified: true
      });

      expect(ProfileController.createDefault).toBeCalledTimes(1)
      expect(ProfileController.createDefault).toBeCalledWith(1)
      expect(ProfileController.findById).toBeCalledTimes(1)
      expect(ProfileController.getAllLikedPosts).toBeCalledTimes(1)
      expect(ProfileController.getAllPosts).toBeCalledTimes(1)
    })

    it('should get all posts that user liked or user posted', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);
      mockAllProfile(fakeProfile, [fakePost, fakePost], [fakePost])

      await request(app).get('/user/1').expect(200, {
        id: fakeUser.id,
        username: fakeUser.username,
        contact: 'abc@example.com',
        bio: 'abcdefgh',
        canModify: false,
        likes: [fakePost, fakePost],
        posts: [fakePost],
        isVerified: true
      });

      expect(ProfileController.createDefault).toBeCalledTimes(0)
      expect(ProfileController.findById).toBeCalledTimes(1)
      expect(ProfileController.getAllLikedPosts).toBeCalledTimes(1)
      expect(ProfileController.getAllPosts).toBeCalledTimes(1)
    })
  })

  describe('when resending verification token', () => {
    it('should fail if user is not logged in', async () => {

      const res = await request(app).get('/user/1/resendVerification')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Must Be Logged In To Update Profile' }])
    })

    it('should fail if finding user throws error', async () => {
      (UserController.findById as jest.Mock).mockImplementationOnce(() => fakeUser);
      (UserController.findById as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await user.get('/user/1/resendVerification')

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
    })

    it('should fail if user does not exist', async () => {
      (UserController.findById as jest.Mock).mockReturnValueOnce(fakeUser);
      (UserController.findById as jest.Mock).mockReturnValueOnce(undefined)

      const res = await user.get('/user/1/resendVerification')

      expect(res.status).toBe(404)
      expect(res.body).toEqual([{ message: 'User Not Found' }])
      expect(UserController.findById).toBeCalledTimes(2)
    })

    it('should fail if user id to resend verification to is not same as session user', async () => {
      (UserController.findById as jest.Mock).mockReturnValueOnce(fakeUser);
      (UserController.findById as jest.Mock).mockReturnValueOnce({ ...fakeUser, id: fakeUser.id + 1 })

      const res = await user.get('/user/2/resendVerification')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Only Original User Can Resend Verification' }])
    })

    it('should fail if the user is already verified', async () => {
      (UserController.findById as jest.Mock).mockReturnValueOnce(fakeUser);
      (UserController.findById as jest.Mock).mockReturnValueOnce(fakeUser)

      const res = await user.get('/user/2/resendVerification')

      expect(res.status).toBe(400)
      expect(res.body).toEqual([{ message: 'User Is Already Verified' }])
    })

    it('should fail if finding verify data fails', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(unverifiedUser);
      (UserController.findById as jest.Mock).mockReturnValue(unverifiedUser);
      (UserController.findVerifyDataById as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await user.get('/user/2/resendVerification')

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(UserController.findVerifyDataById).toBeCalledTimes(1)
    })

    it('should fail if verify data doesnt exist but inserting token fails', async () => {
      (UserController.findVerifyDataById as jest.Mock).mockReturnValueOnce(undefined);
      (UserController.insertToken as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await user.get('/user/2/resendVerification')

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(UserController.findVerifyDataById).toBeCalledTimes(1)
      expect(UserController.insertToken).toBeCalledTimes(1)
    })

    it('should fail if verify data doesnt exist but sending mail fails', async () => {
      (UserController.findVerifyDataById as jest.Mock).mockReturnValueOnce(undefined);
      (UserController.insertToken as jest.Mock).mockImplementation(() => { return });
      (Mail.sendMail as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await user.get('/user/2/resendVerification')

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(UserController.findVerifyDataById).toBeCalledTimes(1)
      expect(UserController.insertToken).toBeCalledTimes(1)
      expect(Mail.sendMail).toBeCalledTimes(1)
    })

    it('should pass if verify data doesnt exist but new one was created and sent', async () => {
      (UserController.findVerifyDataById as jest.Mock).mockReturnValueOnce(undefined);
      (Mail.sendMail as jest.Mock).mockImplementationOnce(() => { return })

      const res = await user.get('/user/2/resendVerification')

      expect(res.status).toBe(200)
      expect(UserController.findVerifyDataById).toBeCalledTimes(1)
      expect(UserController.insertToken).toBeCalledTimes(1)
      expect(Mail.sendMail).toBeCalledTimes(1)
    })

    it('should fail if token fails to verify but updating token fails', async () => {
      (UserController.findVerifyDataById as jest.Mock).mockReturnValue(fakeVerifyData);
      (Mail.verifyTimeSent as jest.Mock).mockImplementation(() => false);
      (UserController.updateToken as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await user.get('/user/2/resendVerification')

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(UserController.findVerifyDataById).toBeCalledTimes(1)
      expect(UserController.updateToken).toBeCalledTimes(1)
    })

    it('should fail if token fails to verify but sending mail fails', async () => {
      (UserController.updateToken as jest.Mock).mockImplementation(() => { return });
      (Mail.sendMail as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await user.get('/user/2/resendVerification')

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(UserController.findVerifyDataById).toBeCalledTimes(1)
      expect(UserController.updateToken).toBeCalledTimes(1)
      expect(Mail.sendMail).toBeCalledTimes(1)
    })

    it('should pass if token fails to verify but token is updated and sent', async () => {
      (Mail.sendMail as jest.Mock).mockImplementationOnce(() => { return })

      const res = await user.get('/user/2/resendVerification')

      expect(res.status).toBe(200)
      expect(UserController.findVerifyDataById).toBeCalledTimes(1)
      expect(UserController.updateToken).toBeCalledTimes(1)
      expect(Mail.sendMail).toBeCalledTimes(1)
    })

    it('should fail if token verifies but sending mail fails', async () => {
      (Mail.verifyTimeSent as jest.Mock).mockReturnValue(true);
      (Mail.sendMail as jest.Mock).mockImplementationOnce(() => { throw new Error() });

      const res = await user.get('/user/2/resendVerification')

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(UserController.findVerifyDataById).toBeCalledTimes(1)
      expect(Mail.sendMail).toBeCalledTimes(1)
    })

    it('should pass if token verifies and mail is sent', async () => {
      (Mail.verifyTimeSent as jest.Mock).mockReturnValue(true);
      (Mail.sendMail as jest.Mock).mockImplementationOnce(() => { return });

      const res = await user.get('/user/2/resendVerification')

      expect(res.status).toBe(200)
      expect(UserController.findVerifyDataById).toBeCalledTimes(1)
      expect(Mail.sendMail).toBeCalledTimes(1)
    })
  })
})