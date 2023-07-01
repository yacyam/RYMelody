jest.mock('../../controllers/post')

import { jest, expect, describe, it } from '@jest/globals'
import makeApp from "../../utils/createApp";
import request from 'supertest'
import * as Post from '../../controllers/post'


const app = makeApp()

describe('inside of post endpoint', () => {
  describe('getting an id', () => {
    it('should report a status of 404 when id not found', async () => {
      (Post.findById as jest.Mock).mockReturnValue(undefined)

      const res = await request(app).get('/post/0')

      expect(res.status).toEqual(404)
      expect(Post.findById).toBeCalledTimes(1)
    })


  })
})