jest.mock('../../controllers/user')

import { Request, Response } from 'express'
import { jest, expect, describe, it } from '@jest/globals'
import { Profile } from '../../database/Profile';
import { makeApp } from "../../utils/createApp";
import request from 'supertest'
import * as UserController from '../../controllers/user'
import * as ProfileController from '../../controllers/profile'
import { updateProfilePortion } from '../../routes/user'
import { HomePost } from '../../database/Post';


const app = makeApp()

const fakeUser = {
  id: 1,
  username: 'abcde',
  email: 'abcdefgh',
  password: 'AKSOMCOXPZMCOPNEIOPNIOWPENFOEMKKNFCZNKWP'
}

const fakeProfile = {
  userid: 1,
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

      expect(RES.sendStatus).toBeCalledTimes(1)
      expect(RES.sendStatus).toBeCalledWith(401)
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
        userid: fakeUser.id,
        username: fakeUser.username,
        contact: '',
        bio: '',
        canModify: false,
        likes: [],
        posts: []
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
        userid: fakeUser.id,
        username: fakeUser.username,
        contact: 'abc@example.com',
        bio: 'abcdefgh',
        canModify: false,
        likes: [fakePost, fakePost],
        posts: [fakePost]
      });

      expect(ProfileController.createDefault).toBeCalledTimes(0)
      expect(ProfileController.findById).toBeCalledTimes(1)
      expect(ProfileController.getAllLikedPosts).toBeCalledTimes(1)
      expect(ProfileController.getAllPosts).toBeCalledTimes(1)
    })
  })
})