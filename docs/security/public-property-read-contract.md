# Public property-read contract

**Status:** client implementation proposal for Backend issue #2. This document does not deploy Firestore rules.

## Public marketplace behavior

- Browsing the marketplace is anonymous; Web does not require a Firebase Auth session for public listings.
- A public listing is a property document whose server-controlled `active` field is exactly `true`.
- Public feed/search queries must include `where("active", "==", true)`. Firestore Security Rules are not query filters: an unrestricted collection query must be denied rather than partially filtered by rules.
- Queries are bounded to pages of 24 documents by default and no more than 50 per request. Subsequent pages use the preceding page's last document as a cursor.
- Authenticated owners may have a separate owner-scoped query for their own drafts; this public Web feed does not issue that query.

## Public/private document boundary

The public `properties/{propertyId}` document must contain only listing fields safe for anonymous readers. It must not contain owner phone/email or private account data.

Private property contact data uses the shared mobile path:

```text
properties/{propertyId}/contact/info
  phone
  email
```

The browser feed never reads that contact document. iOS and Android adapters must write contact attributes only to that child document. Existing parent documents that already contain legacy contact fields must be sanitized before Backend issue #2 enables anonymous reads; Firestore rules cannot redact fields from a document response.

## Failure and empty-state behavior

- An empty successful query renders an explicit no-listings state.
- `permission-denied` is shown as an authorization failure, not converted to an empty list.
- Network/unavailable/deadline errors are shown separately and remain retryable.
- The Web client contains no Secret Manager access, server credentials, or Storage upload path.
