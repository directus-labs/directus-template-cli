import {DEFAULT_REPO} from '../constants.js'

interface GitHubUrlParts {
  owner: string
  path?: string
  ref?: string
  repo: string
}

/**
   * Parse a GitHub URL into its components.
   * @param url - The GitHub URL to parse.
   * @returns The parsed GitHub URL components.
   */
export function parseGitHubUrl(url: string): GitHubUrlParts {
  // Handle simple template names by using default repo
  if (!url.includes('/')) {
    return {...DEFAULT_REPO, path: url}
  }

  // Handle different GitHub URL formats:
  // - https://github.com/owner/repo
  // - https://github.com/owner/repo/tree/branch
  // - https://github.com/owner/repo/tree/branch/path
  // - owner/repo
  // - owner/repo/path
  try {
    if (url.startsWith('https://github.com/')) {
      url = url.replace('https://github.com/', '')
    }

    const parts = url.split('/')
    const owner = parts[0]
    const repo = parts[1]

    let path = ''
    let ref

    if (parts.length > 2) {
      if (parts[2] === 'tree' && parts.length > 3) {
        ref = parts[3]
        path = parts.slice(4).join('/')
      } else {
        path = parts.slice(2).join('/')
      }
    }

    return {owner, path, ref, repo}
  } catch {
    throw new Error(`Invalid GitHub URL format: ${url}`)
  }
}

export function createGigetString({owner, path, ref, repo}: GitHubUrlParts): string {
  let source = `github:${owner}/${repo}`
  if (path) source += `/${path}`
  if (ref) source += `#${ref}`

  return source
}
