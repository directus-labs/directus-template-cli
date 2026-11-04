/**
 * Read an explicit ref from the `ref` query parameter or a `#ref` suffix. `?ref=` wins when both are present.
 * These are the only way to pass a branch name with slashes, which a /tree/ URL alone can't express.
 * @param url The URL to read (scheme optional)
 * @returns The decoded ref, if one was given
 */
export function getExplicitRef(url: string): string | undefined {
  let parsed: URL
  try {
    parsed = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`)
  } catch {
    return undefined
  }

  const query = parsed.searchParams.get('ref')
  if (query) return query

  return parsed.hash.length > 1 ? safeDecode(parsed.hash.slice(1)) : undefined
}

/**
 * Count how many raw path segments after /tree/ make up the ref.
 * With an explicit ref, segments are consumed while their decoded join matches it, so fully, partly,
 * or un-encoded slashes all work. With no match, one segment is the tree ref and the explicit ref overrides it.
 * @param segments Raw path segments starting at the ref, e.g. ['feature', 'foo', 'templates'] or ['feature%2Ffoo', 'templates']
 * @param explicitRef Ref from `?ref=` or `#ref`
 * @returns The number of segments that make up the ref
 */
export function countRefSegments(segments: string[], explicitRef?: string): number {
  if (!explicitRef) return 1

  let joined = ''
  for (const [index, segment] of segments.entries()) {
    joined = index === 0 ? safeDecode(segment) : `${joined}/${safeDecode(segment)}`
    if (joined === explicitRef) return index + 1
    if (!explicitRef.startsWith(`${joined}/`)) break
  }

  return 1
}

/**
 * Build the `/tree/<ref>` part of a GitHub URL, plus a `?ref=` query when the ref can't round-trip through the path alone
 * (slashes or characters that need encoding).
 * @param ref The ref
 * @returns The encoded ref path and the query string (empty when not needed)
 */
export function encodeRef(ref: string): {path: string; query: string} {
  const path = ref.split('/').map(segment => encodeURIComponent(segment)).join('/')
  const needsQuery = ref.includes('/') || path !== ref
  return {path, query: needsQuery ? `?ref=${encodeURIComponent(ref)}` : ''}
}

export function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}
