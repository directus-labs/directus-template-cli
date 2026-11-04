/**
 * Read an explicit ref from `?ref=` or a `#ref` suffix. `?ref=` wins when both are present.
 * These are the only way to pass a branch name with slashes, which a /tree/ URL alone can't express.
 * @param url The URL to read
 * @returns The decoded ref, if one was given
 */
export function getExplicitRef(url: string): string | undefined {
  const query = url.match(/[?&]ref=([^&#]*)/)
  if (query?.[1]) return decodeURIComponent(query[1])

  const hashIndex = url.indexOf('#')
  if (hashIndex !== -1 && hashIndex < url.length - 1) return decodeURIComponent(url.slice(hashIndex + 1))

  return undefined
}

/**
 * Count how many path segments after /tree/ belong to the ref.
 * With an explicit ref, its segments are consumed only when they match the (decoded) path.
 * Otherwise one segment is the tree ref, and an explicit ref overrides it.
 * @param segments Raw path segments starting at the ref, e.g. ['feature', 'foo', 'templates'] or ['feature%2Ffoo', 'templates']
 * @param explicitRef Ref from `?ref=` or `#ref`
 * @returns The number of segments that make up the ref
 */
export function countRefSegments(segments: string[], explicitRef?: string): number {
  if (!explicitRef) return 1

  const refParts = explicitRef.split('/')
  const matches = refParts.every((part, index) => segments[index] !== undefined && safeDecode(segments[index]) === part)

  return matches ? refParts.length : 1
}

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}
