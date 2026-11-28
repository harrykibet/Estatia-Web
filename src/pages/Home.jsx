import { useEffect, useState } from 'react'
import PropertyCard from '@/components/ui/PropertyCard'
import { fetchProperties } from '@/services/propertyService'
import { publicListingErrorKind } from '@/services/publicListingContract.mjs'

function listingErrorMessage(error) {
  switch (publicListingErrorKind(error)) {
    case 'permission-denied':
      return 'The listing service denied access. Please try again later.'
    case 'network':
      return 'We could not reach the listing service. Check your connection and try again.'
    default:
      return 'Unable to load public listings right now. Please try again later.'
  }
}

export default function Home() {
  const [properties, setProperties] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [loadMoreError, setLoadMoreError] = useState(null)

  useEffect(() => {
    let active = true

    fetchProperties()
      .then((page) => {
        if (active) {
          setProperties(page.properties)
          setNextCursor(page.nextCursor)
        }
      })
      .catch((fetchError) => {
        if (active) {
          setError(listingErrorMessage(fetchError))
          console.error(fetchError)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return

    setLoadingMore(true)
    setLoadMoreError(null)
    try {
      const page = await fetchProperties({ cursor: nextCursor })
      setProperties((current) => [...current, ...page.properties])
      setNextCursor(page.nextCursor)
    } catch (fetchError) {
      setLoadMoreError(listingErrorMessage(fetchError))
      console.error(fetchError)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Real estate listings for fast-growing teams</p>
          <h1>Scalable property discovery for ambitious applications.</h1>
          <p className="page-copy">
            Browse published property listings with a bounded, privacy-aware data contract.
          </p>
        </div>
      </header>

      {loading && <p className="status-message">Loading latest listings…</p>}
      {error && <p className="status-message status-error" role="alert">{error}</p>}
      {!loading && !error && properties.length === 0 && (
        <p className="status-message">No public listings are available right now.</p>
      )}

      <section className="listing-grid">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </section>

      {loadMoreError && (
        <p className="status-message status-error" role="alert">{loadMoreError}</p>
      )}
      {nextCursor && (
        <button type="button" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading…' : 'Load more listings'}
        </button>
      )}
    </div>
  )
}
