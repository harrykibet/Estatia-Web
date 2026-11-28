import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildPublicListingQuery,
  publicListingErrorKind
} from '../services/publicListingContract.mjs'

test('public listing query is anonymous and constrained to active documents', () => {
  const collectionRef = { path: 'properties' }
  const calls = []
  const firestoreApi = {
    where: (...args) => {
      calls.push(['where', ...args])
      return { kind: 'where', args }
    },
    limit: (value) => {
      calls.push(['limit', value])
      return { kind: 'limit', value }
    },
    startAfter: (cursor) => {
      calls.push(['startAfter', cursor])
      return { kind: 'startAfter', cursor }
    },
    query: (collection, ...constraints) => ({ collection, constraints })
  }

  const result = buildPublicListingQuery(collectionRef, firestoreApi)

  assert.equal(result.collection, collectionRef)
  assert.deepEqual(calls[0], ['where', 'active', '==', true])
  assert.equal(calls.at(-1)[0], 'limit')
  assert.equal(calls.at(-1)[1], 24)
  assert.equal(calls.some((call) => call[0] === 'where' && call[1] === 'ownerId'), false)
})

test('public listing query applies the cursor and caller page size', () => {
  const cursor = { id: 'last-seen-document' }
  const calls = []
  const firestoreApi = {
    where: (...args) => ({ kind: 'where', args }),
    limit: (value) => ({ kind: 'limit', value }),
    startAfter: (value) => {
      calls.push(['startAfter', value])
      return { kind: 'startAfter', value }
    },
    query: (collection, ...constraints) => ({ collection, constraints })
  }

  const result = buildPublicListingQuery(
    { path: 'properties' },
    firestoreApi,
    { pageSize: 12, cursor }
  )

  assert.deepEqual(calls, [['startAfter', cursor]])
  assert.equal(result.constraints[0].args[0], 'active')
  assert.equal(result.constraints[1].value, cursor)
  assert.equal(result.constraints[2].value, 12)
})

test('public listing query rejects unbounded or invalid page sizes', () => {
  const firestoreApi = {
    where: () => ({}),
    limit: (value) => ({ value }),
    startAfter: () => ({}),
    query: (...args) => args
  }

  assert.throws(
    () => buildPublicListingQuery({}, firestoreApi, { pageSize: 0 }),
    { name: 'RangeError' }
  )
  assert.throws(
    () => buildPublicListingQuery({}, firestoreApi, { pageSize: 1000 }),
    { name: 'RangeError' }
  )
})

test('public listing errors distinguish authorization from network failures', () => {
  assert.equal(publicListingErrorKind({ code: 'permission-denied' }), 'permission-denied')
  assert.equal(publicListingErrorKind({ code: 'unavailable' }), 'network')
  assert.equal(publicListingErrorKind({ code: 'deadline-exceeded' }), 'network')
  assert.equal(publicListingErrorKind({ code: 'internal' }), 'unknown')
})
