jest.mock('../../controllers/user')
jest.mock('../../controllers/post')

import { jest, expect, describe, it } from '@jest/globals'
import * as UserController from '../../controllers/user'
import * as PostController from '../../controllers/post'
import { User, OptionalUser } from '../../database/User';
import * as Auth from '../../utils/formAuth'
import { authorizeReplyChange } from '../../utils/formAuth'
import { generateRandomStrings } from '../../utils/fuzz';
import { RawReply, Tags } from '../../database/Post';
import { verifyTimeSent } from '../../utils/mail'

const NOT_FILLED_ERROR = 'All Fields Must Be Filled In'

const fakeUser: User = {
  id: 1,
  username: 'abcde',
  email: 'abcdefgh',
  password: 'AKSOMCOXPZMCOPNEIOPNIOWPENFOEMKKNFCZNKWP',
  verified: true
}

const USERNAME = 'abcde'
const EMAIL = 'example@gmail.com'
const PASS = 'abcdefgh'
const CONF = 'abcdefgh'

const TITLE = 'abcde'
const DESC = 'abcde'
const AUDIO = 'a'

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

const fakeRawComment = {
  id: 1,
  userid: fakeUser.id,
  postid: fakePost.id,
  comment: 'abcdefgh'
}

const fakeRawReply: RawReply = {
  id: 1,
  userid: fakeUser.id,
  commentid: fakeRawComment.id,
  postid: fakePost.id,
  replyid: null
}


afterEach(() => {
  jest.clearAllMocks()
})

type findOne = (arg: OptionalUser) => Promise<User | undefined>

describe('inside of form auth', () => {
  describe('when authorizing register form', () => {
    it('should fail when some field does not exist', async () => {
      jest.spyOn(Auth, 'authorizeRegisterForm')

      const errors = [
        ["", EMAIL, PASS, CONF],
        [USERNAME, "", PASS, CONF],
        [USERNAME, EMAIL, "", CONF],
        [USERNAME, EMAIL, PASS, ""],
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

    it('should fail if the username is more than 30 characters', async () => {
      (UserController.findOne as jest.Mock).mockReturnValue(undefined)
      const allUsernames = generateRandomStrings(31, 100, 50)

      await allUsernames.map(async username => {
        const errors = await Auth.authorizeRegisterForm(username, EMAIL, PASS, CONF)
        expect(errors.length).toEqual(1)
        expect(errors[0].message).toEqual('Username Must Be 1 - 30 Characters')
      })

      expect(UserController.findOne).toBeCalledTimes(100)
    })

    it('should fail if the password is less than 8 characters', async () => {
      (UserController.findOne as jest.Mock).mockReturnValue(undefined)
      const allPasswords = generateRandomStrings(1, 8, 50)

      await allPasswords.map(async password => {
        const errors = await Auth.authorizeRegisterForm(USERNAME, EMAIL, password, password)
        expect(errors.length).toEqual(1)
        expect(errors[0].message).toEqual('Password Must Be At Least 8 Characters')
      })

      expect(UserController.findOne).toBeCalledTimes(100)
      expect(Auth.authorizeRegisterForm).toBeCalledTimes(50)
    })

    it('should fail if pass is less 8 chars and confirm does not match', async () => {
      (UserController.findOne as jest.Mock).mockReturnValue(undefined)
      const allPasswords = generateRandomStrings(1, 8, 50)

      await allPasswords.map(async password => {
        const errors = await Auth.authorizeRegisterForm(USERNAME, EMAIL, password, CONF)
        expect(errors.length).toEqual(2)
        expect(errors[0].message).toEqual('Password Must Be At Least 8 Characters')
        expect(errors[1].message).toEqual('Both Passwords Must Match')
      })

      expect(UserController.findOne).toBeCalledTimes(100)
      expect(Auth.authorizeRegisterForm).toBeCalledTimes(50)
    })

    it('should fail if email is in invalid format', async () => {
      (UserController.findOne as jest.Mock).mockReturnValue(undefined)
      const invalidEmails = [
        "email@!@1email",
        "@example.com",
        "exampleemail.com",
        "$^$**)email@email",
        "abc@example."
      ]

      await invalidEmails.map(async email => {
        const errors = await Auth.authorizeRegisterForm(USERNAME, email, PASS, CONF)
        expect(errors.length).toEqual(1)
        expect(errors[0].message).toEqual('Email Must Be In Valid Format')
      })

      expect(Auth.authorizeRegisterForm).toBeCalledTimes(5)
      expect(UserController.findOne).toBeCalledTimes(10)

    })

    it('should pass is everything is correctly formatted', async () => {
      (UserController.findOne as jest.Mock).mockReturnValue(undefined)

      const errors = await Auth.authorizeRegisterForm(USERNAME, EMAIL, PASS, CONF)

      expect(errors.length).toEqual(0)
      expect(UserController.findOne).toBeCalledTimes(2)
    })
  })

  describe('when authorizing post form', () => {
    jest.spyOn(Auth, 'authorizePostForm')

    it('should fail if user id does not exist', () => {
      const errors = Auth.authorizePostForm('', '', '', 0, TAGS, -1)

      expect(errors.length).toEqual(1)
      expect(errors[0].message).toEqual('Must Be Signed In To Create Post')
      expect(Auth.authorizePostForm).toBeCalledTimes(1)
    })

    it('should fail if one of the fields does not exist', () => {
      const data: [string, string, string, number, Tags, number][] = [
        ['', DESC, AUDIO, 123, TAGS, 2],
        [TITLE, '', AUDIO, 123124, TAGS, 542],
        [TITLE, AUDIO, '', 21, TAGS, 24]
      ]

      data.map(([title, desc, audio, size, tags, id]) => {
        const errors = Auth.authorizePostForm(title, desc, audio, size, tags, id)

        expect(errors.length).toEqual(1)
        expect(errors[0].message).toEqual('All Fields Must Be Filled In')
      })

      expect(Auth.authorizePostForm).toBeCalledTimes(3)

    })

    it('should fail if title is not in specified range', () => {

      const errs1 = Auth.authorizePostForm(generateRandomStrings(1, 4, 1)[0], DESC, AUDIO, 1, TAGS, 5)
      const errs2 = Auth.authorizePostForm(generateRandomStrings(61, 200, 1)[0], DESC, AUDIO, 1, TAGS, 5)

      expect(errs1.length).toEqual(1)
      expect(errs2.length).toEqual(1)
      expect(errs1[0].message).toEqual('Title Must Be 5 - 60 Characters Long')
      expect(errs2[0].message).toEqual('Title Must Be 5 - 60 Characters Long')
      expect(Auth.authorizePostForm).toBeCalledTimes(2)
    })

    it('should fail if desc is not in specified range', () => {
      const errs1 = Auth.authorizePostForm(TITLE, generateRandomStrings(1, 4, 1)[0], AUDIO, 1, TAGS, 5)
      const errs2 = Auth.authorizePostForm(TITLE, generateRandomStrings(1, 4, 1)[0], AUDIO, 1, TAGS, 5)

      expect(errs1.length).toEqual(1)
      expect(errs2.length).toEqual(1)
      expect(errs1[0].message).toEqual('Description Must be 5 - 800 Characters Long')
      expect(errs2[0].message).toEqual('Description Must be 5 - 800 Characters Long')
      expect(Auth.authorizePostForm).toBeCalledTimes(2)
    })

    it('should fail if audio size too large', () => {
      const errors = Auth.authorizePostForm(TITLE, DESC, AUDIO, 1048577, TAGS, 5)

      expect(errors.length).toEqual(1)
      expect(errors[0].message).toEqual('File Size Too Large, Please Keep Below 1MB')
      expect(Auth.authorizePostForm).toBeCalledTimes(1)
    })

    it('should fail if more or less than 3 tags are selected', () => {
      const newTags: Tags = {
        ...TAGS,
        electronic: true
      }
      const errors = Auth.authorizePostForm(TITLE, DESC, AUDIO, 1, newTags, 5)

      expect(errors.length).toEqual(1)
      expect(errors[0].message).toEqual('Must Only Have At Most 2 Tags Selected')
    })

    it('should pass if all fields are within valid ranges', () => {
      const errors = Auth.authorizePostForm(TITLE, DESC, AUDIO, 1, TAGS, 5)

      expect(errors.length).toEqual(0)
      expect(Auth.authorizePostForm).toBeCalledTimes(1)
    })
  })

  describe('when authorizing comment form', () => {
    jest.spyOn(Auth, 'authorizeCommentForm')

    it('should fail if post is not found', async () => {
      (PostController.findById as jest.Mock).mockReturnValue(undefined)

      const errors = await Auth.authorizeCommentForm("-1", "abcde")

      expect(errors.length).toEqual(1)
      expect(errors[0].message).toEqual('This Post Does Not Exist')
      expect(Auth.authorizeCommentForm).toBeCalledTimes(1)
      expect(PostController.findById).toBeCalledTimes(1)
    })

    it('should fail if comment length is not in range', async () => {
      (PostController.findById as jest.Mock).mockReturnValue(fakePost)

      const errs1 = await Auth.authorizeCommentForm("1", "abc")
      const errs2 = await Auth.authorizeCommentForm("1", generateRandomStrings(401, 1000, 1)[0])

      expect(errs1.length).toEqual(1)
      expect(errs1[0].message).toEqual('Comment Must be 4 - 400 Characters Long')
      expect(errs2.length).toEqual(1)
      expect(errs2[0].message).toEqual('Comment Must be 4 - 400 Characters Long')
      expect(Auth.authorizeCommentForm).toBeCalledTimes(2)
      expect(PostController.findById).toBeCalledTimes(2)
    })

    it('should pass if all fields are within range', async () => {
      (PostController.findById as jest.Mock).mockReturnValue(fakePost)

      const errors = await Auth.authorizeCommentForm("1", generateRandomStrings(4, 400, 1)[0])

      expect(errors.length).toEqual(0)
      expect(Auth.authorizeCommentForm).toBeCalledTimes(1)
      expect(PostController.findById).toBeCalledTimes(1)
    })
  })

  describe('when authorizing update form', () => {
    jest.spyOn(Auth, 'authorizeUpdateForm')

    it('should fail if post does not exist', async () => {
      (PostController.findById as jest.Mock).mockReturnValue(undefined)

      const errors = await Auth.authorizeUpdateForm(1, "", "")

      expect(errors.length).toEqual(1)
      expect(errors[0].message).toEqual('Cannot Edit Post That Does Not Exist')
      expect(Auth.authorizeUpdateForm).toBeCalledTimes(1)
      expect(PostController.findById).toBeCalledTimes(1)
    })

    it('should fail if post user id is not same as userId arg', async () => {
      (PostController.findById as jest.Mock).mockReturnValue(fakePost)

      const errors = await Auth.authorizeUpdateForm(2, "1", "")

      expect(errors.length).toEqual(1)
      expect(errors[0].message).toEqual('Must Be Original Poster to Edit Description')
      expect(Auth.authorizeUpdateForm).toBeCalledTimes(1)
      expect(PostController.findById).toBeCalledTimes(1)
    })

    it('should fail if text is not within specified range', async () => {
      (PostController.findById as jest.Mock).mockReturnValue(fakePost)

      const errs1 = await Auth.authorizeUpdateForm(1, "1", generateRandomStrings(0, 5, 1)[0])
      const errs2 = await Auth.authorizeUpdateForm(1, "1", generateRandomStrings(801, 1000, 1)[0])

      expect(errs1.length).toEqual(1)
      expect(errs1[0].message).toEqual('Description Must be 5 - 800 Characters Long')
      expect(errs2.length).toEqual(1)
      expect(errs2[0].message).toEqual('Description Must be 5 - 800 Characters Long')
      expect(Auth.authorizeUpdateForm).toBeCalledTimes(2)
      expect(PostController.findById).toBeCalledTimes(2)
    })

    it('should pass if all fields are in range', async () => {
      (PostController.findById as jest.Mock).mockReturnValue(fakePost)

      const errors = await Auth.authorizeUpdateForm(1, "1", generateRandomStrings(5, 800, 1)[0])

      expect(errors.length).toEqual(0)
      expect(Auth.authorizeUpdateForm).toBeCalledTimes(1)
      expect(PostController.findById).toBeCalledTimes(1)
    })

  })

  describe('when authorizing update profile', () => {
    it('should fail if the user does not exist', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(undefined)

      const errors = await Auth.authorizeUpdateProfile("1", 1, "", 1)

      expect(errors.length).toEqual(1)
      expect(errors[0].message).toEqual('This User Profile Does Not Exist')
      expect(UserController.findById).toBeCalledTimes(1)
    })

    it('should fail if the user id does not equal session id', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser)

      const errors = await Auth.authorizeUpdateProfile("1", 2, "", 1)

      expect(errors.length).toEqual(1)
      expect(errors[0].message).toEqual('Must Be Signed In As User to Update Profile')
      expect(UserController.findById).toBeCalledTimes(1)
    })

    it('should fail if the text length is larger than desired length', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser)

      const errors = await Auth.authorizeUpdateProfile("1", 1, "abc", 2)

      expect(errors.length).toEqual(1)
      expect(errors[0].message).toEqual('Inputted Text Length Must Be At Most 2 Characters')
      expect(UserController.findById).toBeCalledTimes(1)
    })

    it('should pass if all fields are in desired range', async () => {
      (UserController.findById as jest.Mock).mockReturnValue(fakeUser)

      const errors = await Auth.authorizeUpdateProfile("1", 1, generateRandomStrings(1, 50, 1)[0], 51)

      expect(errors.length).toEqual(0)
      expect(UserController.findById).toBeCalledTimes(1)
    })
  })

  describe('when authorizing comment update', () => {
    it('should fail if user id of comment is different from session user id', async () => {

      const errors = await Auth.authorizeUpdateComment(1, 2, 1, "1", "")

      expect(errors.length).toBe(1)
      expect(errors[0].message).toBe('Must Be Original Commenter To Edit Comment')
    })

    it('should fail if comment associated with id does not exist', async () => {
      (PostController.findCommentById as jest.Mock).mockReturnValueOnce(undefined)
      const errors = await Auth.authorizeUpdateComment(1, 1, 12345, "1", "")

      expect(errors.length).toBe(1)
      expect(errors[0].message).toBe('Comment Does Not Exist')
    })

    it('should fail if user id of comment from db is different from user logged in', async () => {
      (PostController.findCommentById as jest.Mock).mockReturnValueOnce(fakeRawComment)
      const errors = await Auth.authorizeUpdateComment(2, 2, 12345, `${fakePost.id}`, "abcdefg")

      expect(errors.length).toBe(1)
      expect(errors[0].message).toBe('Original Commenter Is Not Same As User In Session')
    })

    it('should fail if post attr with comment is not same as post id argument', async () => {
      (PostController.findCommentById as jest.Mock).mockReturnValueOnce(fakeRawComment)

      const errors = await Auth.authorizeUpdateComment(1, 1, 12345, `${fakePost.id + 1}`, "abcdefg")

      expect(errors.length).toBe(1)
      expect(errors[0].message).toBe('Editing Comment Under Different Post')
    })

    it('should fail if new comment length is not in specified range', async () => {
      (PostController.findCommentById as jest.Mock).mockReturnValueOnce(fakeRawComment)

      const errors = await Auth.authorizeUpdateComment(1, 1, 12345, `${fakePost.id}`, "ab")

      expect(errors.length).toBe(1)
      expect(errors[0].message).toBe('Comment Must be 4 - 400 Characters Long')
    })

    it('should have multiple errors if > 1 field is incorrect', async () => {
      (PostController.findCommentById as jest.Mock).mockReturnValueOnce(fakeRawComment)

      const errors = await Auth.authorizeUpdateComment(2, 2, 12345, `${fakePost.id + 1}`, "ab")

      expect(errors.length).toBe(3)
      expect(errors).toEqual([
        { message: 'Original Commenter Is Not Same As User In Session' },
        { message: 'Editing Comment Under Different Post' },
        { message: 'Comment Must be 4 - 400 Characters Long' }
      ])
    })

    it('should pass with no errors if all fields are correct', async () => {
      (PostController.findCommentById as jest.Mock).mockReturnValueOnce(fakeRawComment)

      const errors = await Auth.authorizeUpdateComment(1, 1, 2, `${fakePost.id}`, "abcdef")

      expect(errors.length).toBe(0)
      expect(PostController.findCommentById).toBeCalledTimes(1)
    })
  })

  describe('when verifying time sent of verification token', () => {
    it('should fail if token is more than a day old in same month and year', () => {
      const moreOneDay = new Date(new Date().getTime() - ((1000 * 60 * 60 * 24) + 1))

      const check = verifyTimeSent(moreOneDay)

      expect(check).toBe(false)
    })

    it('should fail if token is some amount of days old in the same month and year', () => {
      const someDays = 2 + Math.floor(Math.random() * 10)
      const coupleDaysOff = new Date(new Date().getTime() - (1000 * 60 * 60 * 24 * someDays))

      const check = verifyTimeSent(coupleDaysOff)

      expect(check).toBe(false)
    })

    it('should fail if token is different month same year', () => {
      const moreOneMonth = new Date(new Date().getTime() - (1000 * 60 * 60 * 24 * 31))

      const check = verifyTimeSent(moreOneMonth)

      expect(check).toBe(false)
    })

    it('should fail if token is off by a few months in same year', () => {
      const someMonths = 1 + Math.floor(Math.random() * 8)
      const moreSomeMonths = new Date(new Date().getTime() - (1000 * 60 * 60 * 24 * 31 * someMonths))

      const check = verifyTimeSent(moreSomeMonths)

      expect(check).toBe(false)
    })

    it('should fail if token is off by a year same month and day', () => {
      const oneYear = new Date(new Date().getTime() - (1000 * 60 * 60 * 24 * 31 * 12))
      const currTime = new Date()

      const check = verifyTimeSent(oneYear)

      expect(check).toBe(false)
      expect(currTime.getFullYear()).toEqual(oneYear.getFullYear() + 1)
    })

    it('should pass if token was sent in the same day', () => {
      const sameDayBoundary = new Date(new Date().getTime() - ((1000 * 60 * 60 * 24) - 1))
      const sameDayCloser = new Date(new Date().getTime() - (1000 * 60 * 60 * 8))

      const check1 = verifyTimeSent(sameDayBoundary)
      const check2 = verifyTimeSent(sameDayCloser)

      expect(check1).toBe(true)
      expect(check2).toBe(true)
    })
  })

  describe('when authorizing reply form', () => {
    it('should fail if the post does not exist', async () => {
      (PostController.findById as jest.Mock).mockReturnValueOnce(undefined)

      const errors = await Auth.authorizeReplyForm(1, 1, "1", "abcde", true)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toEqual("Post Does Not Exist")
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.findById).toBeCalledWith("1")
    })

    it('should fail if the comment does not exist', async () => {
      (PostController.findById as jest.Mock).mockReturnValue(fakePost);
      (PostController.findCommentById as jest.Mock).mockReturnValueOnce(undefined)

      const errors = await Auth.authorizeReplyForm(12, 1, "1", "abc", true)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toEqual("Comment Does Not Exist, Cannot Reply To It")
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.findById).toBeCalledWith("1")
      expect(PostController.findCommentById).toBeCalledTimes(1)
      expect(PostController.findCommentById).toBeCalledWith(12)
    })

    it('should fail if post id of comment is different from id of post given', async () => {
      (PostController.findCommentById as jest.Mock).mockReturnValueOnce({ ...fakeRawComment, postid: fakePost.id + 1 })

      const errors = await Auth.authorizeReplyForm(5, undefined, "1", "abcde", true)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toEqual("Comment Exists Under Different Post")
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.findCommentById).toBeCalledTimes(1)
    })

    it('should fail if reply id not specified when replying to reply', async () => {
      (PostController.findCommentById as jest.Mock).mockReturnValue(fakeRawComment)

      const errors = await Auth.authorizeReplyForm(5, undefined, "4", "abcd", false)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toEqual("Reply Not to Main Comment Should Specify A Reply Id")
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.findCommentById).toBeCalledTimes(1)
    })

    it('should fail if replying to reply that does not exist', async () => {
      (PostController.findReplyById as jest.Mock).mockReturnValueOnce(undefined)

      const errors = await Auth.authorizeReplyForm(4, 2, "3", "abcd", false)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toEqual("Reply Does Not Exist")
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.findCommentById).toBeCalledTimes(1)
      expect(PostController.findReplyById).toBeCalledTimes(1)
      expect(PostController.findReplyById).toBeCalledWith(2)
    })

    it('should fail if replying to reply under different comment', async () => {
      (PostController.findReplyById as jest.Mock).mockReturnValueOnce({ ...fakeRawReply, commentid: fakeRawComment.id + 1 })

      const errors = await Auth.authorizeReplyForm(1, 1, "1", "abcd", false)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toEqual('Reply Is Under Different Comment')
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.findCommentById).toBeCalledTimes(1)
      expect(PostController.findReplyById).toBeCalledTimes(1)
    })

    it('should fail if replying to reply under different post', async () => {
      (PostController.findReplyById as jest.Mock).mockReturnValueOnce({ ...fakeRawReply, postid: fakePost.id + 1 })

      const errors = await Auth.authorizeReplyForm(1, 1, "3", "abcd", false)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toEqual('Reply Is Under Different Post')
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.findCommentById).toBeCalledTimes(1)
      expect(PostController.findReplyById).toBeCalledTimes(1)
    })

    it('should fail if a main comment reply but reply id is given', async () => {
      const errors = await Auth.authorizeReplyForm(1, 12, "1", "abcd", true)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toEqual('Reply Id Should Not Be Defined If Replying To Main Comment')
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.findCommentById).toBeCalledTimes(1)
      expect(PostController.findReplyById).toBeCalledTimes(0)
    })

    it('should fail if reply length is not within specified range', async () => {
      (PostController.findReplyById as jest.Mock).mockReturnValue(fakeRawReply)

      const errs1 = await Auth.authorizeReplyForm(1, 1, "1", "ab", false)
      const errs2 = await Auth.authorizeReplyForm(1, undefined, "1", generateRandomStrings(401, 1000, 1)[0], true)

      expect(errs1.length).toBe(1)
      expect(errs1[0].message).toEqual("Reply Must Be 4 - 400 Characters Long")
      expect(errs2.length).toBe(1)
      expect(errs2[0].message).toEqual("Reply Must Be 4 - 400 Characters Long")
      expect(PostController.findById).toBeCalledTimes(2)
      expect(PostController.findCommentById).toBeCalledTimes(2)
      expect(PostController.findReplyById).toBeCalledTimes(1)
    })

    it('should fail if multiple errors are given (not main comment reply)', async () => {
      (PostController.findCommentById as jest.Mock).mockReturnValueOnce({ ...fakeRawComment, postid: fakePost.id + 1 });
      (PostController.findReplyById as jest.Mock).mockReturnValueOnce(
        {
          ...fakeRawReply,
          postid: fakePost.id + 1,
          commentid: fakeRawComment.id + 1
        }
      );
      const errors = await Auth.authorizeReplyForm(1, 1, "1", "a", false)

      expect(errors.length).toBe(4)
      expect(errors[0].message).toEqual('Comment Exists Under Different Post')
      expect(errors[1].message).toEqual('Reply Is Under Different Comment')
      expect(errors[2].message).toEqual('Reply Is Under Different Post')
      expect(errors[3].message).toEqual('Reply Must Be 4 - 400 Characters Long')
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.findCommentById).toBeCalledTimes(1)
      expect(PostController.findReplyById).toBeCalledTimes(1)
    })

    it('should fail if multiple errors are given (main comment reply)', async () => {
      (PostController.findCommentById as jest.Mock).mockReturnValueOnce({ ...fakeRawComment, postid: fakePost.id + 1 });

      const errors = await Auth.authorizeReplyForm(1, 1, "1", "ab", true)

      expect(errors.length).toBe(3)
      expect(errors[0].message).toEqual('Comment Exists Under Different Post')
      expect(errors[1].message).toEqual('Reply Id Should Not Be Defined If Replying To Main Comment')
      expect(errors[2].message).toEqual('Reply Must Be 4 - 400 Characters Long')
      expect(PostController.findById).toBeCalledTimes(1)
      expect(PostController.findCommentById).toBeCalledTimes(1)
    })

    it('should pass with no errors if all fields are correct', async () => {
      const errs1 = await Auth.authorizeReplyForm(1, 1, "1", "abcde", false)
      const errs2 = await Auth.authorizeReplyForm(1, undefined, "1", "abcdefgh", true)

      expect(errs1.length).toBe(0)
      expect(errs2.length).toBe(0)
      expect(PostController.findById).toBeCalledTimes(2)
      expect(PostController.findCommentById).toBeCalledTimes(2)
      expect(PostController.findReplyById).toBeCalledTimes(1)
    })
  })

  describe('when authorizing reply change', () => {
    it('should fail if reply does not exist', async () => {
      (PostController.findReplyById as jest.Mock).mockReturnValueOnce(undefined)

      const errors = await Auth.authorizeReplyChange(0, 1, "1", 1)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toEqual("Reply Does Not Exist")
      expect(PostController.findReplyById).toBeCalledTimes(1)
      expect(PostController.findReplyById).toBeCalledWith(0)
    })

    it('should fail if reply id arg is different from database reply id', async () => {
      (PostController.findReplyById as jest.Mock).mockReturnValue(fakeRawReply)

      const errors = await Auth.authorizeReplyChange(fakeRawReply.id + 1, 1, "1", 1)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toEqual('Database Returned Incorrect Reply')
      expect(PostController.findReplyById).toBeCalledTimes(1)
      expect(PostController.findReplyById).toBeCalledWith(fakeRawReply.id + 1)
    })

    it('should fail if user id arg is different from reply user id', async () => {
      const errors = await Auth.authorizeReplyChange(fakeRawReply.id, 1, "1", fakeRawReply.userid + 1)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toEqual('Only Original Replier Can Edit Reply')
      expect(PostController.findReplyById).toBeCalledTimes(1)
      expect(PostController.findReplyById).toBeCalledWith(fakeRawReply.id)
    })

    it('should fail if comment id arg is different from reply comment id', async () => {
      const errors = await Auth.authorizeReplyChange(
        fakeRawReply.id,
        fakeRawReply.commentid + 1,
        `${fakeRawReply.postid}`,
        fakeRawReply.userid
      );
      expect(errors.length).toBe(1)
      expect(errors[0].message).toEqual('Editing Reply Under Different Comment')
      expect(PostController.findReplyById).toBeCalledTimes(1)
    })

    it('should fail if post id arg is different from reply post id', async () => {
      const errors = await Auth.authorizeReplyChange(
        fakeRawReply.id,
        fakeRawReply.commentid,
        `${fakeRawReply.postid + 1}`,
        fakeRawReply.userid
      );
      expect(errors.length).toBe(1)
      expect(errors[0].message).toEqual('Editing Reply Under Different Post')
      expect(PostController.findReplyById).toBeCalledTimes(1)
    })

    it('should fail with multiple errors if comment and post id wrong', async () => {
      const errors = await Auth.authorizeReplyChange(
        fakeRawReply.id,
        fakeRawReply.commentid + 1,
        `${fakeRawReply.postid + 1}`,
        fakeRawReply.userid
      );
      expect(errors.length).toBe(2)
      expect(errors[0].message).toEqual('Editing Reply Under Different Comment')
      expect(errors[1].message).toEqual('Editing Reply Under Different Post')
      expect(PostController.findReplyById).toBeCalledTimes(1)
    })

    it('should pass if all checking passes', async () => {
      const errors = await Auth.authorizeReplyChange(
        fakeRawReply.id,
        fakeRawReply.commentid,
        `${fakeRawReply.postid}`,
        fakeRawReply.userid
      );
      expect(errors.length).toBe(0)
      expect(PostController.findReplyById).toBeCalledTimes(1)
    })
  })

  describe('when authorizing reply edit', () => {

    jest.spyOn(Auth, 'authorizeReplyChange')

    it('should be identical to single reply change error if text length valid', async () => {
      const errors = await Auth.authorizeUpdateReply(fakeRawReply.id, 0, `1`, fakeRawReply.userid + 1, "abcd")

      expect(errors.length).toBe(1)
      expect(errors[0].message).toEqual("Only Original Replier Can Edit Reply")
    })

    it('should be identical to all reply change errors if text length valid', async () => {

      const errors = await Auth.authorizeUpdateReply(
        fakeRawReply.id,
        fakeRawReply.commentid + 1,
        `${fakeRawReply.postid + 1}`,
        fakeRawReply.userid,
        "abcd"
      )

      expect(errors.length).toBe(2)
      expect(errors[0].message).toEqual("Editing Reply Under Different Comment")
      expect(errors[1].message).toEqual("Editing Reply Under Different Post")

    })

    it('should have 1 extra error if text length is invalid', async () => {

      const errs1 = await Auth.authorizeUpdateReply(
        fakeRawReply.id,
        fakeRawReply.commentid + 1,
        `${fakeRawReply.postid + 1}`,
        fakeRawReply.userid,
        "ab"
      )

      const errs2 = await Auth.authorizeUpdateReply(fakeRawReply.id + 1, 1, "1", 1, generateRandomStrings(401, 1000, 1)[0])

      expect(errs1.length).toBe(3)
      expect(errs1[2].message).toBe('Reply Must Be 4 - 400 Characters Long')
      expect(errs2.length).toBe(2)
      expect(errs2[1].message).toBe('Reply Must Be 4 - 400 Characters Long')
    })

    it('should have no errors if text length is valid and reply change authorizes', async () => {
      const errors = await Auth.authorizeUpdateReply(
        fakeRawReply.id,
        fakeRawReply.commentid,
        `${fakeRawReply.postid}`,
        fakeRawReply.userid,
        "abcde"
      )

      expect(errors.length).toBe(0)
    })
  })

  describe('when authorizing delete form', () => {

    it('should return the same errors as reply change auth', async () => {
      const errs1 = await Auth.authorizeDeleteReply(
        fakeRawReply.id,
        fakeRawReply.commentid + 1,
        `${fakeRawReply.postid + 1}`,
        fakeRawReply.userid
      )

      const errs2 = await Auth.authorizeDeleteReply(
        fakeRawReply.id,
        fakeRawReply.commentid,
        `${fakeRawReply.postid}`,
        fakeRawReply.userid + 1,
      )

      expect(errs1.length).toBe(2)
      expect(errs2.length).toBe(1)
      expect(errs1[0].message).toEqual("Editing Reply Under Different Comment")
      expect(errs1[1].message).toEqual("Editing Reply Under Different Post")
      expect(errs2[0].message).toEqual('Only Original Replier Can Edit Reply')
    })

    it('should have no errors if reply change authorizes', async () => {
      const errors = await Auth.authorizeDeleteReply(
        fakeRawReply.id,
        fakeRawReply.commentid,
        `${fakeRawReply.postid}`,
        fakeRawReply.userid
      )

      expect(errors.length).toBe(0)
    })
  })
})