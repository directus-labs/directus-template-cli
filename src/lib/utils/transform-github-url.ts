export interface ParsedGitHubUrl {
  owner: string
  ref?: string
  repo: string
  subpath?: string
}

export function parseGitHubUrl(url: string): ParsedGitHubUrl {
  const cleaned = url.trim().replace(/\.git$/, '').replace(/\/+$/, '')
  const regex = /github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+)(?:\/(.+))?)?$/
  const match = cleaned.match(regex)

  if (!match) {
    throw new Error(`Invalid GitHub URL: ${url}`)
  }

  const [, owner, repo, ref, subpath] = match
  return {owner, ref, repo, subpath}
}

export function transformGitHubUrl(url: string): string {
  const {owner, ref, repo, subpath} = parseGitHubUrl(url)
  const pathPart = subpath ? `/${subpath}` : ''
  const refPart = ref ? `#${ref}` : ''
  return `github:${owner}/${repo}${pathPart}${refPart}`
}
