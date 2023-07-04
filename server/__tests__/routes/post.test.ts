jest.mock('../../controllers/post')
jest.mock('../../controllers/user')
jest.mock('../../utils/hash')

import { jest, expect, describe, it } from '@jest/globals'
import { makeApp, makeAppSession } from "../../utils/createApp";
import request from 'supertest'
import * as PostController from '../../controllers/post'
import * as UserController from '../../controllers/user'
import * as Encrypt from '../../utils/hash'
import { returnsOrThrows } from '../../utils/fuzz';
import { Tags } from '../../database/Post';


const app = makeApp()
const server = makeAppSession()
let user: request.SuperAgentTest

const fakeUser = {
  id: 1,
  username: 'abcde',
  email: 'abcdefgh',
  password: 'AKSOMCOXPZMCOPNEIOPNIOWPENFOEMKKNFCZNKWP'
}

beforeAll(async () => {
  user = request.agent(server);

  (UserController.findOne as jest.Mock).mockReturnValue(fakeUser);
  (Encrypt.comparePassword as jest.Mock).mockReturnValue(true);

  await user.post('/auth/login')
    .send({ username: 'abcde', password: '123' })
    .type('json')
})

const TAGS: Tags = {
  electronic: false,
  hiphop: false,
  pop: true,
  rock: false,
  punk: false,
  metal: true,
  jazz: false,
  classical: false
}

const fakePost = {
  id: 1,
  userid: 1,
  username: "abcdefg",
  title: "abcde",
  description: "abcde",
  audio: "abcde"
}

afterEach(() => {
  jest.clearAllMocks()
})

function createPostIdMock() {
  (PostController.findById as jest.Mock).mockReturnValue(fakePost);
  (PostController.findCommentsById as jest.Mock).mockReturnValue([]);
  (PostController.getAllLikes as jest.Mock).mockReturnValue(1);
  (PostController.getTags as jest.Mock).mockReturnValue(TAGS);
}

describe('inside of post endpoint', () => {
  describe('getting an id', () => {
    it('should report a status of 404 when post id not found', async () => {
      (PostController.findById as jest.Mock).mockReturnValue(undefined)

      const res = await request(app).get('/post/0')

      expect(res.status).toEqual(404)
      expect(PostController.findById).toBeCalledTimes(1)
    })

    it('should fail if any one of the post controllers throws error', async () => {
      (PostController.findById as jest.Mock).mockReturnValue(fakePost);
      (PostController.findCommentsById as jest.Mock).mockImplementation(returnsOrThrows([]));
      (PostController.getAllLikes as jest.Mock).mockImplementation(returnsOrThrows(10));
      (PostController.getTags as jest.Mock).mockImplementation(() => { throw new Error() });

      const res = await request(app).get('/post/1')

      expect(res.status).toEqual(500)
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.findById).toReturnWith(fakePost)
      expect(PostController.findCommentsById).toBeCalledTimes(1)
    })

    it('should pass without canModify if all fields are specified correctly', async () => {
      createPostIdMock()

      const res = await request(app).get('/post/1')

      expect(res.status).toEqual(200)
      expect(res.body).toEqual({
        ...fakePost,
        comments: [],
        tags: TAGS,
        amountLikes: 1,
        isPostLiked: false,
        canModify: false
      })
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.findCommentsById).toBeCalledTimes(1)
      expect(PostController.getAllLikes).toBeCalledTimes(1)
      expect(PostController.getTags).toBeCalledTimes(1)

    })


    it('should pass with canModify if user who posted is logged into session', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);
      createPostIdMock();
      (PostController.userLikedPost as jest.Mock).mockReturnValue(true)

      const res = await user.get('/post/1')

      expect(res.status).toEqual(200)
      expect(res.body).toEqual({
        ...fakePost,
        comments: [],
        tags: TAGS,
        amountLikes: 1,
        isPostLiked: true,
        canModify: true
      })
    })

    it('should NOT pass with canModify if current session user is different from poster', async () => {
      const newUser = {
        ...fakeUser,
        id: 15
      };
      (UserController.findById as jest.Mock).mockReturnValue(newUser);
      createPostIdMock();
      (PostController.userLikedPost as jest.Mock).mockReturnValue(true)

      const res = await user.get('/post/1')

      expect(res.status).toEqual(200)
      expect(res.body).toEqual({
        ...fakePost,
        comments: [],
        tags: TAGS,
        amountLikes: 1,
        isPostLiked: true,
        canModify: false
      })
    })

  })
})