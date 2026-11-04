import {countRefSegments, getExplicitRef} from './github-ref.js'

export interface ParsedGitHubUrl {
  owner: string
  ref?: string
  repo: string
  subpath?: string
}

export function parseGitHubUrl(url: string): ParsedGitHubUrl {
  const cleaned = url.trim().replace(/\/+$/, '')
  const urlToParse = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`
  let parsed: URL

  try {
    parsed = new URL(urlToParse)
  } catch {
    throw new Error(`Invalid GitHub URL: ${url}`)
  }

  if (!['github.com', 'www.github.com'].includes(parsed.hostname.toLowerCase())) {
    throw new Error(`Invalid GitHub URL: ${url}`)
  }

  const pathParts = parsed.pathname.split('/').filter(Boolean)
  const [owner, rawRepo, tree, treeRef] = pathParts
  const repo = rawRepo?.replace(/\.git$/, '')

  if (!owner || !repo || pathParts.length > 2 && tree !== 'tree') {
    throw new Error(`Invalid GitHub URL: ${url}`)
  }

  if (tree === 'tree' && !treeRef) {
    throw new Error(`Invalid GitHub URL: ${url}`)
  }

  const explicitRef = getExplicitRef(cleaned)
  const ref = explicitRef || treeRef
  const subpathParts = tree === 'tree' ? pathParts.slice(3 + countRefSegments(pathParts.slice(3), explicitRef)) : []

  const subpath = subpathParts.length > 0 ? subpathParts.join('/') : undefined

  return {owner, ref, repo, subpath}
}

export function transformGitHubUrl(url: string): string {
  const {owner, ref, repo, subpath} = parseGitHubUrl(url)
  const pathPart = subpath ? `/${subpath}` : ''
  const refPart = ref ? `#${ref}` : ''
  return `github:${owner}/${repo}${pathPart}${refPart}`
}
