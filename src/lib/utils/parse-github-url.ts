import {DEFAULT_BRANCH, DEFAULT_REPO} from '../constants.js'

interface GitHubUrlParts {
  owner: string
  path?: string
  ref?: string
  repo: string
}

/**
 * Clean and normalize a GitHub URL
 * Handles various formats:
 * - Full URLs with .git
 * - URLs with query parameters
 * - URLs with hash fragments
 * - URLs with branches/refs
 * - Repository paths
 * @param url The URL or path to clean
 * @returns Cleaned URL without .git, queries, or hashes
 */
function cleanGitHubUrl(url: string): string {
  try {
    // If it's not a URL, return as is (might be a path)
    if (!url.includes('://')) {
      return url.replace(/\.git$/, '')
    }

    // Parse the URL
    const parsed = new URL(url)

    // Remove .git suffix from pathname
    parsed.pathname = parsed.pathname.replace(/\.git$/, '')

    // Remove search params and hash
    parsed.search = ''
    parsed.hash = ''

    return parsed.toString()
  } catch {
    // If URL parsing fails, just remove .git suffix
    return url.replace(/\.git$/, '')
  }
}

/**
 * Read an explicit ref from `?ref=` or a `#ref` suffix. These are the only way to pass a branch name with slashes.
 * @param url The URL or path to read
 * @returns The ref, if one was given
 */
function getExplicitRef(url: string): string | undefined {
  const hashIndex = url.indexOf('#')
  if (hashIndex !== -1 && hashIndex < url.length - 1) return decodeURIComponent(url.slice(hashIndex + 1))

  const match = url.match(/[?&]ref=([^&#]+)/)
  return match ? decodeURIComponent(match[1]) : undefined
}

/**
 * Split the ref and path out of a /tree/ or /blob/ URL. A branch with slashes can't be told apart from the path,
 * so an explicit ref decides how many segments belong to the ref.
 * @param pathParts URL path segments
 * @param refIndex Index of the first ref segment
 * @param explicitRef Ref from `?ref=` or `#ref`
 * @returns The ref and path
 */
function splitTreePath(pathParts: string[], refIndex: number, explicitRef?: string): {path?: string; ref: string} {
  const refSegments = explicitRef ? explicitRef.split('/').length : 1
  return {
    path: pathParts.slice(refIndex + refSegments).join('/') || undefined,
    ref: explicitRef || pathParts[refIndex],
  }
}

/**
 * Parse a GitHub URL or path into its components
 * @param url The URL or path to parse
 * @returns The parsed components
 */
export function parseGitHubUrl(url: string): GitHubUrlParts {
  if (!url) {
    throw new Error('URL is required')
  }

  const explicitRef = getExplicitRef(url)
  const cleanedUrl = cleanGitHubUrl(url.split('#')[0])

  if (cleanedUrl.includes('github.com')) {
    try {
      const parsed = new URL(cleanedUrl)
      const pathParts = parsed.pathname.split('/').filter(Boolean)

      if (pathParts.length < 2) {
        throw new Error('Invalid GitHub URL format: Needs owner and repo.')
      }

      const owner = pathParts[0]
      const repo = pathParts[1]
      let ref = DEFAULT_BRANCH // Default ref
      let path: string | undefined

      // Check for /tree/ref/ or /blob/ref/ patterns
      const treeIndex = pathParts.indexOf('tree')
      const blobIndex = pathParts.indexOf('blob')
      let refIndex = -1

      if (treeIndex > 1 && treeIndex + 1 < pathParts.length) {
        refIndex = treeIndex + 1
      } else if (blobIndex > 1 && blobIndex + 1 < pathParts.length) {
        refIndex = blobIndex + 1
      }

      if (refIndex === -1) {
        // Without tree/blob, anything after owner/repo is the path (github.com/owner/repo/some/path)
        if (pathParts.length > 2) path = pathParts.slice(2).join('/') || undefined
        ref = explicitRef || ref
      } else {
        ({path, ref} = splitTreePath(pathParts, refIndex, explicitRef))
      }


      // Ensure path is undefined if empty string
      if (path === '') path = undefined;

      return {owner, path, ref, repo}
    } catch (error: any) {
      throw new Error(`Invalid GitHub URL: ${url}. Error: ${error.message}`)
    }
  }

  // Handle repository paths (owner/repo/path format) without github.com
  const parts = cleanedUrl.split('/').filter(Boolean)
  if (parts.length >= 2) {
    const [owner, repo, ...rest] = parts
    const path = rest.length > 0 ? rest.join('/') : undefined
    return {owner, path, ref: explicitRef || DEFAULT_BRANCH, repo}
  }

  // Handle simple template names using DEFAULT_REPO
  return {
    ...DEFAULT_REPO,
    path: cleanedUrl, // The template name becomes the subpath
    ref: explicitRef || DEFAULT_REPO.ref,
  }
}

/**
 * Creates a giget-compatible string from GitHub URL parts
 * @param parts The parsed GitHub URL parts
 * @returns A string in the format 'gh:owner/repo#ref[/path]'
 */
export function createGigetString(parts: GitHubUrlParts): string {
  // For the default repo case with a template name
  if (parts.owner === DEFAULT_REPO.owner && parts.repo === DEFAULT_REPO.repo) {
    return `gh:${parts.owner}/${parts.repo}/${parts.path}#${parts.ref || DEFAULT_REPO.ref}`
  }

  // For other GitHub URLs
  const base = `gh:${parts.owner}/${parts.repo}`
  const path = parts.path ? `/${parts.path}` : ''
  const ref = parts.ref ? `#${parts.ref}` : ''
  return `${base}${path}${ref}`
}
