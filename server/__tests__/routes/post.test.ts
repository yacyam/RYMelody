jest.mock('../../controllers/post')
jest.mock('../../controllers/user')
jest.mock('../../utils/hash')


import { jest, expect, describe, it } from '@jest/globals'
import { makeApp, makeAppSession } from "../../utils/createApp";
import request from 'supertest'
import * as PostController from '../../controllers/post'
import * as UserController from '../../controllers/user'
import * as Encrypt from '../../utils/hash'
import * as Auth from '../../utils/formAuth'
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

  describe('when getting all posts', () => {
    it('should send an error if post controller fails', async () => {
      (PostController.getPosts as jest.Mock).mockImplementation(() => { throw new Error() })

      const res = await request(app).get('/post/all?q=10&search=abc&newest=true&tags=pop')

      expect(res.status).toEqual(500)
      expect(PostController.getPosts).toBeCalledTimes(1)
      expect(PostController.getPosts).toBeCalledWith("10", "abc", "DESC", "pop")
    })

    it('should pass if all fields are inputted correctly', async () => {
      (PostController.getPosts as jest.Mock).mockReturnValue([fakePost, fakePost])

      const res = await request(app).get('/post/all?q=10&search=abcde&oldest=true&tags=rock&tags=pop')

      expect(res.status).toEqual(200)
      expect(res.body).toEqual([fakePost, fakePost])
      expect(PostController.getPosts).toBeCalledTimes(1)
      expect(PostController.getPosts).toBeCalledWith("10", "abcde", "ASC", ["rock", "pop"])
    })
  })

  describe('when creating a post', () => {
    it('should fail if the user is not logged in', async () => {

      const res = await request(app).post('/post/create').send(fakePost)

      expect(res.status).toEqual(400)
      expect(res.body).toEqual([{ message: 'Must Be Signed In To Create Post' }])
    })

    it('should fail if user is signed in and some aspect of the post is missing', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);
      const newPost = {
        ...fakePost,
        description: '',
        audio: ''
      }

      const res = await user.post('/post/create').send(newPost)

      expect(res.status).toEqual(400)
      expect(res.body).toEqual([{ message: 'All Fields Must Be Filled In' }])
    })

    it('should fail if form passes but creating post fails', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);
      (PostController.createPost as jest.Mock).mockImplementation(() => { throw new Error() })

      const res = await user.post('/post/create').send(
        { ...fakePost, desc: fakePost.description, audioSize: 50, tags: TAGS }
      )

      expect(res.status).toEqual(500)
      expect(PostController.createPost).toBeCalledTimes(1)
      expect(PostController.createPost)
        .toBeCalledWith(1, fakePost.title, fakePost.description, fakePost.audio)
    })

    it('should fail if creating tags fails', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);
      (PostController.createPost as jest.Mock).mockReturnValue(fakePost.id);
      (PostController.createTags as jest.Mock).mockImplementation(() => { throw new Error() })

      const res = await user.post('/post/create').send(
        { ...fakePost, desc: fakePost.description, audioSize: 50, tags: TAGS }
      )

      expect(res.status).toEqual(500)
      expect(PostController.createPost).toBeCalledTimes(1)
      expect(PostController.createPost)
        .toBeCalledWith(1, fakePost.title, fakePost.description, fakePost.audio)
      expect(PostController.createTags).toBeCalledTimes(1)
      expect(PostController.createTags).toBeCalledWith(fakePost.id, TAGS)
    })

    it('should pass if all fields are inputted correctly', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);
      (PostController.createPost as jest.Mock).mockReturnValue(fakePost.id);
      (PostController.createTags as jest.Mock).mockImplementation(() => { return })

      const res = await user.post('/post/create').send(
        { ...fakePost, desc: fakePost.description, audioSize: 50, tags: TAGS }
      )

      expect(res.status).toEqual(200)
      expect(PostController.createPost).toBeCalledTimes(1)
      expect(PostController.createPost)
        .toBeCalledWith(1, fakePost.title, fakePost.description, fakePost.audio)
      expect(PostController.createTags).toBeCalledTimes(1)
      expect(PostController.createTags).toBeCalledWith(fakePost.id, TAGS)
    })
  })

  describe('when creating a comment', () => {
    it('should fail if user is not logged in', async () => {

      const res = await request(app).post('/post/comment')

      expect(res.status).toEqual(401)
      expect(res.body).toEqual([{ message: 'Must Be Logged In To Comment' }])
    })

    it('should fail if the comment form from user does not authorize correctly', async () => {
      jest.spyOn(Auth, 'authorizeCommentForm');
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);
      (Auth.authorizeCommentForm as jest.Mock).mockReturnValue([{ message: 'This Post Does Not Exist' }])

      const res = await user.post('/post/comment').send({ postId: "0", comment: '' })

      expect(res.status).toEqual(400)
      expect(res.body).toEqual([{ message: 'This Post Does Not Exist' }])
      expect(Auth.authorizeCommentForm).toBeCalledTimes(1)
      expect(Auth.authorizeCommentForm).toBeCalledWith("0", "")
    })

    it('should fail if post controller fails to create comment', async () => {
      jest.spyOn(Auth, 'authorizeCommentForm');
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);
      (Auth.authorizeCommentForm as jest.Mock).mockReturnValue([]);
      (PostController.createComment as jest.Mock).mockImplementation(() => { throw new Error() })

      const res = await user.post('/post/comment').send({ postId: "1", comment: 'comment' })

      expect(res.status).toEqual(500)
      expect(Auth.authorizeCommentForm).toBeCalledTimes(1)
      expect(Auth.authorizeCommentForm).toBeCalledWith("1", "comment")
      expect(PostController.createComment).toBeCalledTimes(1)
      expect(PostController.createComment).toBeCalledWith("1", fakeUser.id, "comment")
    })

    it('should pass if all fields are inputted correctly', async () => {
      jest.spyOn(Auth, 'authorizeCommentForm');
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);
      (Auth.authorizeCommentForm as jest.Mock).mockReturnValue([]);
      (PostController.createComment as jest.Mock).mockReturnValue(50)

      const res = await user.post('/post/comment').send({ postId: "1", comment: 'comment' })

      expect(res.status).toEqual(200)
      expect(res.body).toEqual({
        id: 50,
        userId: fakeUser.id,
        username: fakeUser.username
      })
      expect(Auth.authorizeCommentForm).toBeCalledTimes(1)
      expect(PostController.createComment).toBeCalledTimes(1)
    })
  })

  describe('when liking a specific post', () => {
    it('should fail if user is not logged in', async () => {

      const res = await request(app).post('/post/1/like')

      expect(res.status).toEqual(401)
      expect(res.body).toEqual([{ message: 'Must Be Logged In To Like Post' }])
    })

    it('should fail if the post controller fails to return', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);
      (PostController.userLikedPost as jest.Mock).mockImplementation(() => { throw new Error() })

      const res = await user.post('/post/1/like')

      expect(res.status).toEqual(500)
      expect(PostController.userLikedPost).toBeCalledTimes(1)
      expect(PostController.userLikedPost).toBeCalledWith("1", fakeUser.id)
    })

    it('should fail if user liked post but unliking post fails', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);
      (PostController.userLikedPost as jest.Mock).mockReturnValue(true);
      (PostController.unlikePost as jest.Mock).mockImplementation(() => { throw new Error() })

      const res = await user.post('/post/1/like')

      expect(res.status).toEqual(500)
      expect(PostController.userLikedPost).toBeCalledTimes(1)
      expect(PostController.userLikedPost).toBeCalledWith("1", fakeUser.id)
      expect(PostController.unlikePost).toBeCalledTimes(1)
      expect(PostController.unlikePost).toBeCalledWith("1", fakeUser.id)
    })

    it('should fail if user didnt like post but liking fails', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);
      (PostController.userLikedPost as jest.Mock).mockReturnValue(false);
      (PostController.likePost as jest.Mock).mockImplementation(() => { throw new Error() })

      const res = await user.post('/post/1/like')

      expect(res.status).toEqual(500)
      expect(PostController.userLikedPost).toBeCalledTimes(1)
      expect(PostController.userLikedPost).toBeCalledWith("1", fakeUser.id)
      expect(PostController.likePost).toBeCalledTimes(1)
      expect(PostController.likePost).toBeCalledWith("1", fakeUser.id)
    })

    it('should pass if user didnt previously like post and wants to like it', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);
      (PostController.userLikedPost as jest.Mock).mockReturnValue(false);
      (PostController.likePost as jest.Mock).mockImplementation(() => { return })

      const res = await user.post('/post/5/like')

      expect(res.status).toEqual(200)
      expect(res.text).toEqual('liked')
      expect(PostController.userLikedPost).toBeCalledTimes(1)
      expect(PostController.userLikedPost).toBeCalledWith("5", fakeUser.id)
      expect(PostController.likePost).toBeCalledTimes(1)
      expect(PostController.likePost).toBeCalledWith("5", fakeUser.id)
      expect(PostController.unlikePost).toBeCalledTimes(0)
    })

    it('should pass if user previously liked post and wants to unlike it', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser);
      (PostController.userLikedPost as jest.Mock).mockReturnValue(true);
      (PostController.unlikePost as jest.Mock).mockImplementation(() => { return })

      const res = await user.post('/post/25/like')

      expect(res.status).toEqual(200)
      expect(res.text).toEqual('unliked')
      expect(PostController.userLikedPost).toBeCalledTimes(1)
      expect(PostController.userLikedPost).toBeCalledWith("25", fakeUser.id)
      expect(PostController.unlikePost).toBeCalledTimes(1)
      expect(PostController.unlikePost).toBeCalledWith("25", fakeUser.id)
      expect(PostController.likePost).toBeCalledTimes(0)
    })
  })

  // describe('when updaing a specific post', () => {
  //   it('should fail if the user is not logged in', async () => {

  //   })
  // })
})