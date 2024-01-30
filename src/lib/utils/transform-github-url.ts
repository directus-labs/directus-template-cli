export function transformGitHubUrl(url: string): string {
  // Regular expression to capture the repository name and any subsequent path after the 'tree'
  const regex = /github\.com\/([^/]+\/[^/]+)(?:\/tree\/[^/]+\/(.*))?$/
  const match = url.match(regex)

  if (match) {
    const repo = match[1]
    const subpath = match[2] ? match[2] : ''
    return `github:${repo}/${subpath}`
  }

  return 'Invalid URL'
}
