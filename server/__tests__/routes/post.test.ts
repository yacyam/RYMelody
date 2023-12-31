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
import { Comment, ReplyTo, Tags } from '../../database/Post';
import { checkIfModifiable } from '../../routes/post';


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

beforeAll(async () => {
  (UserController.findById as jest.Mock).mockReturnValue(fakeUser);
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

const fakeComment: Comment = {
  id: 1,
  userid: fakeUser.id,
  username: fakeUser.username,
  comment: 'abcdefgh'
}

const fakeRawComment = {
  id: 1,
  userid: 1,
  postid: 5,
  comment: 'abcdefgh'
}

const fakeReply: ReplyTo = {
  id: 1,
  userid: fakeUser.id,
  commentid: fakeComment.id,
  replyid: null,
  postid: fakePost.id,
  username: fakeUser.username,
  reply: "abcde",
  rpuserid: null,
  rpreply: null,
  rpusername: null
}

const INTERNAL_ERR_MSG = [{ message: 'Something Went Wrong, Please Try Again' }]

afterEach(() => {
  jest.clearAllMocks()
})

function createPostIdMock() {
  (PostController.findById as jest.Mock).mockReturnValue(fakePost);
  (PostController.getAllLikes as jest.Mock).mockReturnValue(1);
  (PostController.getTags as jest.Mock).mockReturnValue(TAGS);
}

function unverifiedMock() {
  (UserController.findById as jest.Mock)
    .mockReturnValueOnce({ ...fakeUser, verified: false })
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
      (PostController.getAllLikes as jest.Mock).mockImplementation(returnsOrThrows(10));
      (PostController.getTags as jest.Mock).mockImplementation(() => { throw new Error() });

      const res = await request(app).get('/post/1')

      expect(res.status).toEqual(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.findById).toReturnWith(fakePost)
    })

    it('should pass if all fields are specified correctly', async () => {
      createPostIdMock()

      const res = await request(app).get('/post/1')

      expect(res.status).toEqual(200)
      expect(res.body).toEqual({
        ...fakePost,
        tags: TAGS,
        amountLikes: 1,
        isPostLiked: false,
        canModify: false
      })
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.getAllLikes).toBeCalledTimes(1)
      expect(PostController.getTags).toBeCalledTimes(1)

    })


    it('should make post modifiable if user who posted is logged into session', async () => {
      createPostIdMock();
      (PostController.userLikedPost as jest.Mock).mockReturnValue(true)

      const res = await user.get('/post/1')

      expect(res.status).toEqual(200)
      expect(res.body).toEqual({
        ...fakePost,
        tags: TAGS,
        amountLikes: 1,
        isPostLiked: true,
        canModify: true
      })
    })

    it('should NOT make post modifiable if current session user is different from poster', async () => {
      const newUser = {
        ...fakeUser,
        id: 15
      };
      (UserController.findById as jest.Mock).mockReturnValueOnce(newUser);
      createPostIdMock();
      (PostController.userLikedPost as jest.Mock).mockReturnValue(true)

      const res = await user.get('/post/1')

      expect(res.status).toEqual(200)
      expect(res.body).toEqual({
        ...fakePost,
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
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
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

      expect(res.status).toEqual(401)
      expect(res.body).toEqual([{ message: 'Must Be Signed In To Create Post' }])
    })

    it('should fail if user is not verified', async () => {
      unverifiedMock()

      const res = await user.post('/post/create').send(fakePost)

      expect(res.status).toEqual(401)
      expect(res.body).toEqual([{ message: 'Must Be Verified To Create Post' }])
    })

    it('should fail if user is signed in and some aspect of the post is missing', async () => {
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
      (PostController.createPost as jest.Mock).mockImplementation(() => { throw new Error() })

      const res = await user.post('/post/create').send(
        { ...fakePost, desc: fakePost.description, audioSize: 50, tags: TAGS }
      )

      expect(res.status).toEqual(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(PostController.createPost).toBeCalledTimes(1)
      expect(PostController.createPost)
        .toBeCalledWith(1, fakePost.title, fakePost.description, fakePost.audio)
    })

    it('should fail if creating tags fails', async () => {
      (PostController.createPost as jest.Mock).mockReturnValue(fakePost.id);
      (PostController.createTags as jest.Mock).mockImplementation(() => { throw new Error() })

      const res = await user.post('/post/create').send(
        { ...fakePost, desc: fakePost.description, audioSize: 50, tags: TAGS }
      )

      expect(res.status).toEqual(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(PostController.createPost).toBeCalledTimes(1)
      expect(PostController.createPost)
        .toBeCalledWith(1, fakePost.title, fakePost.description, fakePost.audio)
      expect(PostController.createTags).toBeCalledTimes(1)
      expect(PostController.createTags).toBeCalledWith(fakePost.id, TAGS)
    })

    it('should pass if all fields are inputted correctly', async () => {
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

  describe('when getting all comments', () => {
    const fakeComment1 = { ...fakeComment, userid: fakeComment.userid + 1 }
    const fakeComment2 = { ...fakeComment, userid: fakeComment.userid + 2 }
    const fakeComment3 = { ...fakeComment, userid: fakeComment.userid + 3 }

    it('should fail if post controller throws error in getting comments', async () => {
      (PostController.getComments as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await request(app).get('/post/4/comments')

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(PostController.getComments).toBeCalledTimes(1)
      expect(PostController.getComments).toBeCalledWith("4")
    })

    it('should make all comments unmodifiable if user is not logged in', async () => {
      (PostController.getComments as jest.Mock).mockReturnValueOnce([fakeComment, fakeComment1, fakeComment2, fakeComment3])

      const res = await request(app).get('/post/4/comments')

      expect(res.status).toBe(200)
      expect(res.body.comments).toEqual([
        { ...fakeComment, canModify: false },
        { ...fakeComment1, canModify: false },
        { ...fakeComment2, canModify: false },
        { ...fakeComment3, canModify: false }
      ])
      expect(PostController.getComments).toBeCalledTimes(1)
    })

    it('should make some comments modifiable if user posted it', async () => {
      (PostController.getComments as jest.Mock).mockReturnValueOnce([fakeComment, fakeComment1, fakeComment2])

      const res = await user.get('/post/5/comments')

      expect(res.status).toBe(200)
      expect(res.body.comments).toEqual([
        { ...fakeComment, canModify: true },
        { ...fakeComment1, canModify: false },
        { ...fakeComment2, canModify: false }
      ])
      expect(PostController.getComments).toBeCalledTimes(1)
    })

    it('should make all comments modifiable if user posted them all', async () => {
      (PostController.getComments as jest.Mock).mockReturnValueOnce([fakeComment, fakeComment, fakeComment])

      const res = await user.get('/post/10/comments')

      expect(res.status).toBe(200)
      expect(res.body.comments).toEqual([
        { ...fakeComment, canModify: true },
        { ...fakeComment, canModify: true },
        { ...fakeComment, canModify: true }
      ])
    })
  })

  describe('when creating a comment', () => {
    it('should fail if user is not logged in', async () => {

      const res = await request(app).post('/post/1/comment')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Must Be Logged In To Post Comment' }])
    })

    it('should fail if the user is not signed in', async () => {
      unverifiedMock()

      const res = await user.post('/post/1/comment')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Must Be Verified To Post Comment' }])
    })

    it('should fail if the comment form from user does not authorize correctly', async () => {
      jest.spyOn(Auth, 'authorizeCommentForm');
      (Auth.authorizeCommentForm as jest.Mock).mockReturnValue([{ message: 'This Post Does Not Exist' }])

      const res = await user.post('/post/0/comment').send({ comment: '' })

      expect(res.status).toEqual(400)
      expect(res.body).toEqual([{ message: 'This Post Does Not Exist' }])
      expect(Auth.authorizeCommentForm).toBeCalledTimes(1)
      expect(Auth.authorizeCommentForm).toBeCalledWith("0", "")
    })

    it('should fail if post controller fails to create comment', async () => {
      jest.spyOn(Auth, 'authorizeCommentForm');
      (Auth.authorizeCommentForm as jest.Mock).mockReturnValue([]);
      (PostController.createComment as jest.Mock).mockImplementation(() => { throw new Error() })

      const res = await user.post('/post/1/comment').send({ comment: 'comment' })

      expect(res.status).toEqual(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(Auth.authorizeCommentForm).toBeCalledTimes(1)
      expect(Auth.authorizeCommentForm).toBeCalledWith("1", "comment")
      expect(PostController.createComment).toBeCalledTimes(1)
      expect(PostController.createComment).toBeCalledWith("1", fakeUser.id, "comment")
    })

    it('should pass if all fields are inputted correctly', async () => {
      jest.spyOn(Auth, 'authorizeCommentForm');
      (Auth.authorizeCommentForm as jest.Mock).mockReturnValue([]);
      (PostController.createComment as jest.Mock).mockReturnValue(50)

      const res = await user.post('/post/1/comment').send({ comment: 'comment' })

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

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Must Be Logged In To Like Post' }])
    })

    it('should fail if user is not verified', async () => {
      unverifiedMock()

      const res = await user.post('/post/1/like')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Must Be Verified To Like Post' }])
    })

    it('should fail if the post controller fails to return', async () => {
      (PostController.userLikedPost as jest.Mock).mockImplementation(() => { throw new Error() })

      const res = await user.post('/post/1/like')

      expect(res.status).toEqual(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(PostController.userLikedPost).toBeCalledTimes(1)
      expect(PostController.userLikedPost).toBeCalledWith("1", fakeUser.id)
    })

    it('should fail if user liked post but unliking post fails', async () => {
      (PostController.userLikedPost as jest.Mock).mockReturnValue(true);
      (PostController.unlikePost as jest.Mock).mockImplementation(() => { throw new Error() })

      const res = await user.post('/post/1/like')

      expect(res.status).toEqual(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(PostController.userLikedPost).toBeCalledTimes(1)
      expect(PostController.userLikedPost).toBeCalledWith("1", fakeUser.id)
      expect(PostController.unlikePost).toBeCalledTimes(1)
      expect(PostController.unlikePost).toBeCalledWith("1", fakeUser.id)
    })

    it('should fail if user didnt like post but liking fails', async () => {
      (PostController.userLikedPost as jest.Mock).mockReturnValue(false);
      (PostController.likePost as jest.Mock).mockImplementation(() => { throw new Error() })

      const res = await user.post('/post/1/like')

      expect(res.status).toEqual(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(PostController.userLikedPost).toBeCalledTimes(1)
      expect(PostController.userLikedPost).toBeCalledWith("1", fakeUser.id)
      expect(PostController.likePost).toBeCalledTimes(1)
      expect(PostController.likePost).toBeCalledWith("1", fakeUser.id)
    })

    it('should pass if user didnt previously like post and wants to like it', async () => {
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

  describe('when updaing a specific post', () => {
    it('should fail if the user is not logged in', async () => {

      const res = await request(app).put('/post/1/update')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Only Original Poster Can Edit This Post' }])
    })

    it('should fail if user is not verified', async () => {
      unverifiedMock()

      const res = await user.put('/post/1/update')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Must Be Verified To Edit Post' }])
    })

    jest.spyOn(Auth, 'authorizeUpdateForm');

    it('should fail if authorization throws error', async () => {
      (Auth.authorizeUpdateForm as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await user.put('/post/23/update').send({ text: 'abcde' })

      expect(res.status).toEqual(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(Auth.authorizeUpdateForm).toBeCalledTimes(1)
      expect(Auth.authorizeUpdateForm).toBeCalledWith(fakeUser.id, "23", "abcde")
    })

    it('should fail if authorization does not pass', async () => {
      (Auth.authorizeUpdateForm as jest.Mock).mockReturnValueOnce([{ message: 'This form failed to pass' }])

      const res = await user.put('/post/42/update').send({ text: 'abcdefgh' })

      expect(res.status).toEqual(400)
      expect(res.body).toEqual([{ message: 'This form failed to pass' }])
      expect(Auth.authorizeUpdateForm).toBeCalledTimes(1)
      expect(Auth.authorizeUpdateForm).toBeCalledWith(fakeUser.id, "42", "abcdefgh")
    })

    it('should fail if post controller fails to update', async () => {
      (Auth.authorizeUpdateForm as jest.Mock).mockReturnValueOnce([]);
      (PostController.updateDescription as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await user.put('/post/32/update').send({ text: 'abcdef' })

      expect(res.status).toEqual(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(Auth.authorizeUpdateForm).toBeCalledTimes(1)
      expect(Auth.authorizeUpdateForm).toBeCalledWith(fakeUser.id, "32", "abcdef")
      expect(PostController.updateDescription).toBeCalledTimes(1)
      expect(PostController.updateDescription).toBeCalledWith("32", "abcdef")
    })

    it('should pass if all fields are inputted correctly', async () => {
      (Auth.authorizeUpdateForm as jest.Mock).mockReturnValueOnce([]);
      (PostController.updateDescription as jest.Mock).mockImplementationOnce(() => { return })

      const res = await user.put("/post/12/update").send({ text: 'abcdefghi' })

      expect(res.status).toEqual(200)
      expect(Auth.authorizeUpdateForm).toBeCalledTimes(1)
      expect(Auth.authorizeUpdateForm).toBeCalledWith(fakeUser.id, "12", "abcdefghi")
      expect(PostController.updateDescription).toBeCalledTimes(1)
      expect(PostController.updateDescription).toBeCalledWith("12", "abcdefghi")
    })
  })

  describe('when deleting a post', () => {
    it('should fail if user is not logged in', async () => {
      const res = await request(app).delete('/post/4')

      expect(res.status).toEqual(401)
      expect(res.body).toEqual([{ message: 'Only Original Poster Can Edit This Post' }])
    })

    it('should fail if user is not verified', async () => {
      unverifiedMock()

      const res = await user.delete('/post/4')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Must Be Verified To Delete Post' }])
    })

    it('should fail if finding the post throws an error', async () => {
      (PostController.findById as jest.Mock).mockImplementationOnce(() => { throw new Error() })
      const res = await user.delete('/post/4')

      expect(res.status).toEqual(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(PostController.findById).toBeCalledTimes(1)
    })

    it('should fail if the post does not exist', async () => {
      (PostController.findById as jest.Mock).mockReturnValueOnce(undefined)

      const res = await user.delete('/post/5')

      expect(res.status).toEqual(404)
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.findById).toBeCalledWith("5")
    })

    it('should fail if the user logged in is not the same as user who posted', async () => {
      const newUser = {
        ...fakeUser,
        id: 25
      };
      (UserController.findById as jest.Mock).mockReturnValueOnce(newUser);
      (PostController.findById as jest.Mock).mockReturnValue(fakePost)

      const res = await user.delete('/post/10')

      expect(res.status).toEqual(401)
      expect(res.body).toEqual([{ message: 'Only Original Poster Can Delete This Post' }])
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.findById).toBeCalledWith("10")
    })

    it('should fail if post controller fails to delete post', async () => {
      (PostController.deletePost as jest.Mock).mockImplementationOnce(() => { throw new Error() })
      const res = await user.delete('/post/15')

      expect(res.status).toEqual(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.deletePost).toBeCalledTimes(1)
      expect(PostController.deletePost).toBeCalledWith("15")
    })

    it('should pass if all fields are inputted correctly', async () => {
      (PostController.deletePost as jest.Mock).mockImplementationOnce(() => { return })
      const res = await user.delete('/post/20')

      expect(res.status).toEqual(200)
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.deletePost).toBeCalledTimes(1)
      expect(PostController.deletePost).toBeCalledWith("20")
    })
  })

  describe('when updating a comment', () => {
    jest.spyOn(Auth, 'authorizeUpdateComment')

    it('should fail if user is not logged in', async () => {
      const res = await request(app).put('/post/1/comment')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Must Be Logged In To Edit Comment' }])
    })

    it('should fail if user is not verified', async () => {
      unverifiedMock()

      const res = await user.put('/post/1/comment')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Must Be Verified To Edit Comment' }])
    })

    it('should fail if authorizing comment update throws error', async () => {
      (Auth.authorizeUpdateComment as jest.Mock).mockImplementationOnce(() => { throw new Error() })
      const res = await user.put('/post/1/comment')

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(Auth.authorizeUpdateComment).toBeCalledTimes(1)
    })

    it('should fail if authorizing comment update fails', async () => {
      (Auth.authorizeUpdateComment as jest.Mock).mockReturnValueOnce([{ message: 'Update Failed To Authorize' }])
      const res = await user.put('/post/1/comment')

      expect(res.status).toBe(400)
      expect(res.body).toEqual([{ message: 'Update Failed To Authorize' }])
      expect(Auth.authorizeUpdateComment).toBeCalledTimes(1)
    })

    it('should fail if post controller fails to update comment', async () => {
      (Auth.authorizeUpdateComment as jest.Mock).mockReturnValueOnce([]);
      (PostController.updateComment as jest.Mock).mockImplementationOnce(() => { throw new Error() });

      const res = await user.put('/post/20/comment').send({ id: 1, userId: 1, comment: "abcde" })

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(Auth.authorizeUpdateComment).toBeCalledTimes(1)
      expect(Auth.authorizeUpdateComment).toBeCalledWith(1, fakeUser.id, 1, "20", "abcde")
    })

    it('should pass if all fields are inputted correctly', async () => {
      (Auth.authorizeUpdateComment as jest.Mock).mockReturnValueOnce([]);
      (PostController.updateComment as jest.Mock).mockImplementationOnce(() => { return });

      const res = await user.put('/post/31/comment').send({ id: 12, userId: 1, comment: "abcde" })

      expect(res.status).toBe(200)
      expect(Auth.authorizeUpdateComment).toBeCalledTimes(1)
      expect(Auth.authorizeUpdateComment).toBeCalledWith(1, fakeUser.id, 12, "31", "abcde")
      expect(PostController.updateComment).toBeCalledTimes(1)
      expect(PostController.updateComment).toBeCalledWith(12, "abcde")
    })
  })

  describe('when deleting a comment', () => {

    it('should fail if user is not logged in', async () => {
      const res = await request(app).delete('/post/1/comment')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Only Original Commenter Can Delete Comment' }])
    })

    it('should fail if user is not verified', async () => {
      unverifiedMock()

      const res = await user.delete('/post/1/comment')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Must Be Verified To Delete Comment' }])
    })

    it('should fail if finding the comment throws an error', async () => {
      (PostController.findCommentById as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await user.delete('/post/5/comment').send({ id: 5 })

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(PostController.findCommentById).toBeCalledTimes(1)
      expect(PostController.findCommentById).toBeCalledWith(5)
    })

    it('should fail if the comment does not exist from the id', async () => {
      (PostController.findCommentById as jest.Mock).mockReturnValueOnce(undefined)

      const res = await user.delete('/post/4/comment').send({ id: 5000 })

      expect(res.status).toBe(400)
      expect(res.body).toEqual([{ message: 'Comment Does Not Exist' }])
      expect(PostController.findCommentById).toBeCalledTimes(1)
      expect(PostController.findCommentById).toBeCalledWith(5000)
    })

    it('should fail if logged in user is not original commenter', async () => {
      const newUser = {
        ...fakeUser,
        id: 23
      };
      (PostController.findCommentById as jest.Mock).mockReturnValueOnce(fakeRawComment);
      (UserController.findById as jest.Mock).mockReturnValueOnce(newUser);

      const res = await user.delete('/post/5/comment').send({ id: fakeRawComment.id })

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Only Original Commenter Can Delete Comment' }])
      expect(PostController.findCommentById).toBeCalledTimes(1)
      expect(PostController.findCommentById).toBeCalledWith(fakeRawComment.id)
    })

    it('should fail if comment post id is not same as post id from request', async () => {
      (PostController.findCommentById as jest.Mock).mockReturnValueOnce(fakeRawComment)

      const res = await user.delete('/post/12345/comment').send({ id: fakeRawComment.id })

      expect(res.status).toBe(400)
      expect(res.body).toEqual([{ message: 'Deleting Comment From Another Post' }])
      expect(PostController.findCommentById).toBeCalledTimes(1)
      expect(PostController.findCommentById).toBeCalledWith(fakeRawComment.id)
    })

    it('should fail if post controller fails to delete comment', async () => {
      (PostController.findCommentById as jest.Mock).mockReturnValueOnce(fakeRawComment);
      (PostController.deleteComment as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await user.delete(`/post/${fakeRawComment.postid}/comment`)
        .send({ id: fakeRawComment.id });

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(PostController.findCommentById).toBeCalledTimes(1)
      expect(PostController.findCommentById).toBeCalledWith(fakeRawComment.id)
      expect(PostController.deleteComment).toBeCalledTimes(1)
      expect(PostController.deleteComment).toBeCalledWith(fakeRawComment.id)
    })

    it('should pass if all fields are inputted correctly', async () => {
      (PostController.findCommentById as jest.Mock).mockReturnValueOnce(fakeRawComment);
      (PostController.deleteComment as jest.Mock).mockImplementationOnce(() => { return })

      const res = await user.delete(`/post/${fakeRawComment.postid}/comment`)
        .send({ id: fakeRawComment.id });

      expect(res.status).toBe(200)
      expect(PostController.findCommentById).toBeCalledTimes(1)
      expect(PostController.findCommentById).toBeCalledWith(fakeRawComment.id)
      expect(PostController.deleteComment).toBeCalledTimes(1)
      expect(PostController.deleteComment).toBeCalledWith(fakeRawComment.id)
    })
  })

  describe('when checking if comments are modifiable', () => {
    const newUserId1 = Math.random() * 100
    const newUserId2 = Math.random() * 100
    const newUserId3 = Math.random() * 100
    const newUserId4 = Math.random() * 100
    const newComment1 = { ...fakeComment, userid: newUserId1 }
    const newComment2 = { ...fakeComment, userid: newUserId2 }
    const newComment3 = { ...fakeComment, userid: newUserId3 }
    const newComment4 = { ...fakeComment, userid: newUserId4 }
    it('should make all comments not modifiable if no user id given', async () => {
      const res = checkIfModifiable([newComment1, newComment2, newComment3, newComment4])

      expect(res).toEqual([
        { ...newComment1, canModify: false },
        { ...newComment2, canModify: false },
        { ...newComment3, canModify: false },
        { ...newComment4, canModify: false }
      ])
    })

    it('should make all comments not modifiable if user did not post them', async () => {
      const res = checkIfModifiable([newComment1, newComment2, newComment3, newComment4], -1)

      expect(res).toEqual([
        { ...newComment1, canModify: false },
        { ...newComment2, canModify: false },
        { ...newComment3, canModify: false },
        { ...newComment4, canModify: false }
      ])
    })

    it('should only make the comments which the user posted modifiable', async () => {
      const res = checkIfModifiable([newComment1, newComment2, newComment2, newComment4], newUserId2)

      expect(res).toEqual([
        { ...newComment1, canModify: false },
        { ...newComment2, canModify: true },
        { ...newComment2, canModify: true },
        { ...newComment4, canModify: false }
      ])
    })

    it('should make all comments modifiable if user posted them all', async () => {
      const res = checkIfModifiable([newComment3, newComment3, newComment3, newComment3], newUserId3)

      expect(res).toEqual([
        { ...newComment3, canModify: true },
        { ...newComment3, canModify: true },
        { ...newComment3, canModify: true },
        { ...newComment3, canModify: true }
      ])
    })
  })

  describe('when getting all replies', () => {
    const fakeReply1 = { ...fakeReply, userid: fakeReply.userid + 1 }
    const fakeReply2 = { ...fakeReply, userid: fakeReply.userid + 2 }
    const fakeReply3 = { ...fakeReply, userid: fakeReply.userid + 3 }

    it('should fail if post controller fails to get replies', async () => {
      (PostController.getReplies as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await request(app).get('/post/4/comment/1/replies')

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(PostController.getReplies).toBeCalledTimes(1)
      expect(PostController.getReplies).toBeCalledWith("1")
    })

    it('should make all replies unmodifiable if user is not logged in', async () => {
      (PostController.getReplies as jest.Mock).mockReturnValueOnce([fakeReply, fakeReply1, fakeReply2])

      const res = await request(app).get('/post/4/comment/1/replies')

      expect(res.status).toBe(200)
      expect(res.body.replies).toEqual([
        { ...fakeReply, canModify: false },
        { ...fakeReply1, canModify: false },
        { ...fakeReply2, canModify: false }
      ])
      expect(PostController.getReplies).toBeCalledTimes(1)
    })

    it('should make some replies modifiable if user posted them', async () => {
      (PostController.getReplies as jest.Mock).mockReturnValueOnce([fakeReply1, fakeReply, fakeReply2])

      const res = await user.get('/post/1/comment/1/replies')

      expect(res.status).toBe(200)
      expect(res.body.replies).toEqual([
        { ...fakeReply1, canModify: false },
        { ...fakeReply, canModify: true },
        { ...fakeReply2, canModify: false }
      ])
      expect(PostController.getReplies).toBeCalledTimes(1)
    })

    it('should make all replies modifiable if user posted all', async () => {
      (PostController.getReplies as jest.Mock).mockReturnValueOnce([fakeReply, fakeReply, fakeReply])

      const res = await user.get('/post/1/comment/1/replies')

      expect(res.status).toBe(200)
      expect(res.body.replies).toEqual([
        { ...fakeReply, canModify: true },
        { ...fakeReply, canModify: true },
        { ...fakeReply, canModify: true }
      ])
      expect(PostController.getReplies).toBeCalledTimes(1)
    })
  })

  describe('when posting a new reply', () => {

    const fakeReplyData = {
      commentId: fakeReply.commentid,
      replyId: fakeReply.id,
      reply: fakeReply.reply,
      isMainCommentReply: true
    }

    it('should fail if the user is not logged in', async () => {

      const res = await request(app).post('/post/1/reply')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Must Be Logged In To Reply' }])
    })

    it('should fail if the user is not logged in', async () => {
      (UserController.findById as jest.Mock).mockReturnValueOnce({ ...fakeUser, verified: false })

      const res = await user.post('/post/1/reply')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Must Be Verified To Reply' }])
    })

    jest.spyOn(Auth, 'authorizeReplyForm')

    it('should fail if authorizing the reply form throws error', async () => {
      (Auth.authorizeReplyForm as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await user.post('/post/1/reply')

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(Auth.authorizeReplyForm).toBeCalledTimes(1)
    })

    it('should fail if authorizing the reply form fails', async () => {
      (Auth.authorizeReplyForm as jest.Mock).mockReturnValueOnce([{ message: 'Reply Failed To Authorize' }])

      const res = await user.post('/post/1/reply').send(fakeReplyData)

      expect(res.status).toBe(400)
      expect(res.body).toEqual([{ message: 'Reply Failed To Authorize' }])
      expect(Auth.authorizeReplyForm).toBeCalledTimes(1)
      expect(Auth.authorizeReplyForm).toBeCalledWith(
        fakeReplyData.commentId,
        fakeReplyData.replyId,
        "1",
        fakeReplyData.reply,
        fakeReplyData.isMainCommentReply
      )
    })

    it('should fail if creating a reply fails', async () => {
      (Auth.authorizeReplyForm as jest.Mock).mockReturnValue([]);
      (PostController.createReply as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await user.post('/post/1/reply').send(fakeReplyData)

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(Auth.authorizeReplyForm).toBeCalledTimes(1)
      expect(PostController.createReply).toBeCalledTimes(1)
      expect(PostController.createReply).toBeCalledWith(
        fakeUser.id,
        fakeReplyData.commentId,
        fakeReplyData.replyId,
        "1",
        fakeReplyData.reply
      )
    })

    it('should pass if all fields are correct', async () => {
      (PostController.createReply as jest.Mock).mockReturnValue(10)

      const res = await user.post('/post/1/reply').send(fakeReplyData)

      expect(res.status).toBe(200)
      expect(res.body).toEqual({
        newReplyId: 10,
        userId: fakeUser.id,
        username: fakeUser.username
      })
      expect(Auth.authorizeReplyForm).toBeCalledTimes(1)
      expect(PostController.createReply).toBeCalledTimes(1)
    })
  })

  const fakeEditReply = {
    ...fakeReply,
    commentId: fakeReply.commentid,
    replyId: fakeReply.id,
    text: "abcdefgh",
  }

  const editAuthArgs = (postId: string) => {
    return [
      fakeEditReply.id,
      fakeEditReply.commentid,
      postId,
      fakeEditReply.userid,
      fakeEditReply.text
    ]
  }
  describe('when updating a reply', () => {
    it('should fail if user is not logged in', async () => {
      const res = await request(app).put('/post/4/reply')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Must Be Logged In To Edit Reply' }])
    })

    it('should fail if user is not verified', async () => {
      (UserController.findById as jest.Mock).mockReturnValueOnce({ ...fakeUser, verified: false })
      const res = await user.put('/post/4/reply')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Must Be Verified To Edit Reply' }])
    })

    jest.spyOn(Auth, 'authorizeUpdateReply')

    it('should fail if authorizing edit form errors out', async () => {
      (Auth.authorizeUpdateReply as jest.Mock).mockImplementationOnce(() => { throw new Error() })
      const res = await user.put('/post/4/reply').send(fakeEditReply)

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(Auth.authorizeUpdateReply).toBeCalledTimes(1)
      expect(Auth.authorizeUpdateReply).toBeCalledWith(...editAuthArgs("4"))
    })

    it('should fail if authorizing edit form fails', async () => {
      (Auth.authorizeUpdateReply as jest.Mock).mockReturnValueOnce([{ message: 'Reply Auth Failed' }])
      const res = await user.put('/post/10/reply').send(fakeEditReply)

      expect(res.status).toBe(400)
      expect(res.body).toEqual([{ message: 'Reply Auth Failed' }])
      expect(Auth.authorizeUpdateReply).toBeCalledTimes(1)
      expect(Auth.authorizeUpdateReply).toBeCalledWith(...editAuthArgs("10"))
    })

    it('should fail if updating reply with controller fails', async () => {
      (Auth.authorizeUpdateReply as jest.Mock).mockReturnValue([]);
      (PostController.updateReply as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await user.put('/post/5/reply').send(fakeEditReply)

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(Auth.authorizeUpdateReply).toBeCalledTimes(1)
      expect(Auth.authorizeUpdateReply).toBeCalledWith(...editAuthArgs("5"))
      expect(PostController.updateReply).toBeCalledTimes(1)
      expect(PostController.updateReply).toBeCalledWith(fakeEditReply.replyId, fakeEditReply.text)
    })

    it('should pass if all fields are inputted correctly', async () => {
      const res = await user.put('/post/12/reply').send(fakeEditReply)

      expect(res.status).toBe(200)
      expect(Auth.authorizeUpdateReply).toBeCalledTimes(1)
      expect(PostController.updateReply).toBeCalledTimes(1)
    })
  })

  const deleteAuthArgs = (postId: string) => {
    return [
      fakeEditReply.id,
      fakeEditReply.commentid,
      postId,
      fakeEditReply.userid,
    ]
  }

  describe('when deleting a reply', () => {
    it('should fail if user is not logged in', async () => {
      const res = await request(app).delete('/post/4/reply')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Must Be Logged In To Delete Reply' }])
    })

    it('should fail if user is not verified', async () => {
      (UserController.findById as jest.Mock).mockReturnValueOnce({ ...fakeUser, verified: false })
      const res = await user.delete('/post/4/reply')

      expect(res.status).toBe(401)
      expect(res.body).toEqual([{ message: 'Must Be Verified To Delete Reply' }])
    })

    jest.spyOn(Auth, 'authorizeDeleteReply')
    it('should fail if authorizing delete errors out', async () => {
      (Auth.authorizeDeleteReply as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await user.delete('/post/5/reply').send(fakeEditReply)

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(Auth.authorizeDeleteReply).toBeCalledTimes(1)
      expect(Auth.authorizeDeleteReply).toBeCalledWith(...deleteAuthArgs("5"))
    })

    it('should fail if authorizing delete fails', async () => {
      (Auth.authorizeDeleteReply as jest.Mock).mockReturnValueOnce([{ message: 'Reply Delete Auth Failed' }])

      const res = await user.delete('/post/5/reply').send(fakeEditReply)

      expect(res.status).toBe(400)
      expect(res.body).toEqual([{ message: 'Reply Delete Auth Failed' }])
      expect(Auth.authorizeDeleteReply).toBeCalledTimes(1)
      expect(Auth.authorizeDeleteReply).toBeCalledWith(...deleteAuthArgs("5"))
    })

    it('should fail if deleting reply with controller fails', async () => {
      (Auth.authorizeDeleteReply as jest.Mock).mockReturnValue([]);
      (PostController.deleteReply as jest.Mock).mockImplementationOnce(() => { throw new Error() })

      const res = await user.delete('/post/2/reply').send(fakeEditReply)

      expect(res.status).toBe(500)
      expect(res.body).toEqual(INTERNAL_ERR_MSG)
      expect(Auth.authorizeDeleteReply).toBeCalledTimes(1)
      expect(Auth.authorizeDeleteReply).toBeCalledWith(...deleteAuthArgs("2"))
      expect(PostController.deleteReply).toBeCalledTimes(1)
      expect(PostController.deleteReply).toBeCalledWith(fakeEditReply.replyId)
    })

    it('should pass if all fields are inputted correctly', async () => {
      const res = await user.delete('/post/4/reply').send(fakeEditReply)

      expect(res.status).toBe(200)
      expect(Auth.authorizeDeleteReply).toBeCalledTimes(1)
      expect(Auth.authorizeDeleteReply).toBeCalledWith(...deleteAuthArgs("4"))
      expect(PostController.deleteReply).toBeCalledTimes(1)
      expect(PostController.deleteReply).toBeCalledWith(fakeEditReply.replyId)
    })
  })
})