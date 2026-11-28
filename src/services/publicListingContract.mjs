/**
 * Shared public-listing query contract.
 *
 * Marketplace browsing is intentionally anonymous. Firestore rules will allow
 * reads only for active public listings (or owner-authorized documents), so
 * every non-owner query must prove that its result set is active-only.
 */
export function buildPublicListingQuery(collectionRef, firestoreApi, options = {}) {
  const pageSize = options.pageSize ?? 24
  const cursor = options.cursor ?? null

  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
    throw new RangeError('pageSize must be an integer between 1 and 50')
  }

  const constraints = [firestoreApi.where('active', '==', true)]
  if (cursor) {
    constraints.push(firestoreApi.startAfter(cursor))
  }
  constraints.push(firestoreApi.limit(pageSize))

  return firestoreApi.query(collectionRef, ...constraints)
}

export function publicListingErrorKind(error) {
  if (error?.code === 'permission-denied') return 'permission-denied'
  if (
    error?.code === 'unavailable' ||
    error?.code === 'deadline-exceeded' ||
    error?.code === 'network-request-failed'
  ) {
    return 'network'
  }
  return 'unknown'
}
