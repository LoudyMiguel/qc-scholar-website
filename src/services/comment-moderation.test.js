import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertCommunityCommentAllowed,
  normalizeCommentForComparison,
} from './comment-moderation.js'

test('allows a useful community comment', () => {
  assert.doesNotThrow(() =>
    assertCommunityCommentAllowed(
      'The Python course was helpful. Could you add more file handling examples?',
    ),
  )
})

test('blocks brainrot terms and simple leetspeak evasions', () => {
  assert.throws(() => assertCommunityCommentAllowed('skibidi sigma ohio'))
  assert.throws(() => assertCommunityCommentAllowed('5k1b1d1'))
})

test('blocks link floods, repeated characters, and repeated-word spam', () => {
  assert.throws(() =>
    assertCommunityCommentAllowed('Visit https://one.example and https://two.example'),
  )
  assert.throws(() => assertCommunityCommentAllowed('heyyyyyyyyyyyy'))
  assert.throws(() =>
    assertCommunityCommentAllowed('hello hello hello hello hello hello hello hello hello hello'),
  )
})

test('normalizes text consistently for duplicate detection', () => {
  assert.equal(normalizeCommentForComparison('H3LL0!'), 'helloi')
})
