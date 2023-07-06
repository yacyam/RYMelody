import * as PostController from '../../controllers/post'

import { jest, expect, describe, it } from '@jest/globals'
import { pool } from '../../database/index'

beforeEach(async () => {
  await pool.query('BEGIN')
})

afterEach(async () => {
  await pool.query('ROLLBACK')
})

afterAll(async () => {
  await pool.end()
})

describe('in post controller', () => {
  describe('when inserting a post', () => {
    it('', () => {

    })
    // it('should be findable from the same id it was inserted with', async () => {
    //   const generatedId = await PostController.createPost(1, "abcde", "abcde", "abc")

    //   const obtainedPost = await PostController.findById(generatedId)

    //   expect(`${obtainedPost?.id}`).toEqual(generatedId)
    //   expect(obtainedPost?.title).toEqual("abcde")
    //   expect(obtainedPost?.audio).toEqual("abc")
    // })

    // it('should be deletable from the same id', async () => {
    //   const generatedId = await PostController.createPost(1, "abcde", "abcde", "abc")

    //   await PostController.deletePost(generatedId)

    //   const obtainedPost = await PostController.findById(generatedId)

    //   expect(obtainedPost).toBe(undefined)
    //   expect(parseInt(generatedId)).toBeGreaterThan(0)
    // })

  })
})