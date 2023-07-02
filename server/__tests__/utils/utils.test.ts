jest.mock('../../controllers/user')
jest.mock('../../controllers/post')

import { jest, expect, describe, it } from '@jest/globals'
import * as UserController from '../../controllers/user'
import * as PostController from '../../controllers/post'
import { User, OptionalUser } from '../../database/User';
import * as Auth from '../../utils/formAuth'
import { generateRandomStrings } from '../../utils/fuzz';
import { Tags } from '../../database/Post';

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


afterEach(() => {
  jest.clearAllMocks()
})

type findOne = (arg: OptionalUser) => Promise<User | undefined>

describe('inside of form auth', () => {
  describe('when authorizing register form', () => {
    it('should fail when some field does not exist', async () => {
      jest.spyOn(Auth, 'authorizeRegisterForm')

      const res = [
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
})