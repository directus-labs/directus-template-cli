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
  } catch (error) {
    // If URL parsing fails, just remove .git suffix
    return url.replace(/\.git$/, '')
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

  // Clean the URL first
  const cleanedUrl = cleanGitHubUrl(url)

  // Handle full GitHub URLs
  if (cleanedUrl.includes('github.com')) {
    try {
      const parsed = new URL(cleanedUrl)
      const parts = parsed.pathname.split('/').filter(Boolean)

      if (parts.length < 2) {
        throw new Error('Invalid GitHub URL format')
      }

      const [owner, repo, ...rest] = parts
      const path = rest.length > 0 ? rest.join('/') : undefined
      const ref = parsed.searchParams.get('ref') || DEFAULT_BRANCH

      return {owner, repo, path, ref}
    } catch (error) {
      throw new Error(`Invalid GitHub URL: ${url}`)
    }
  }

  // Handle repository paths (owner/repo format)
  const parts = cleanedUrl.split('/').filter(Boolean)
  if (parts.length >= 2) {
    const [owner, repo, ...rest] = parts
    const path = rest.length > 0 ? rest.join('/') : undefined
    return {owner, repo, path, ref: DEFAULT_BRANCH}
  }

  // Handle simple template names using DEFAULT_REPO
  return {
    ...DEFAULT_REPO,
    path: cleanedUrl // The template name becomes the subpath
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
    return `gh:${parts.owner}/${parts.repo}/${parts.path}#${DEFAULT_REPO.ref}`
  }

  // For other GitHub URLs
  const base = `gh:${parts.owner}/${parts.repo}`
  const path = parts.path ? `/${parts.path}` : ''
  const ref = parts.ref ? `#${parts.ref}` : ''
  return `${base}${path}${ref}`
}
