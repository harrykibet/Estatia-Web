import {
  collection,
  getDocs,
  limit,
  query,
  startAfter,
  where
} from 'firebase/firestore'
import { firestore } from '@/lib/firebase'
import { buildPublicListingQuery } from './publicListingContract.mjs'

const DEFAULT_PAGE_SIZE = 24

/**
 * Loads a bounded page of anonymous public marketplace listings.
 * The Firestore rules contract requires active == true for non-owner reads.
 *
 * @param {{ pageSize?: number, cursor?: import('firebase/firestore').QueryDocumentSnapshot | null }} options
 * @returns {Promise<{ properties: object[], nextCursor: object | null }>}
 */
export async function fetchProperties({ pageSize = DEFAULT_PAGE_SIZE, cursor = null } = {}) {
  const collectionRef = collection(firestore, 'properties')
  const listingQuery = buildPublicListingQuery(
    collectionRef,
    { where, limit, startAfter, query },
    { pageSize, cursor }
  )
  const snapshot = await getDocs(listingQuery)

  return {
    properties: snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })),
    nextCursor: snapshot.docs.length === pageSize
      ? snapshot.docs[snapshot.docs.length - 1]
      : null
  }
}
