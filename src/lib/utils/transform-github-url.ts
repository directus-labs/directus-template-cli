export function transformGitHubUrl(url: string): string {
  // Regular expression to capture the repository name, ref (branch/tag), and any subsequent path
  const regex = /github\.com\/([^/]+\/[^/]+)(?:\/tree\/([^/]+)(?:\/(.*))?)?$/
  const match = url.match(regex)

  if (match) {
    const repo = match[1]
    const ref = match[2] || ''
    const subpath = match[3] || ''

    // Build the giget-compatible URL: github:owner/repo/path#ref
    let result = `github:${repo}`
    if (subpath) {
      result += `/${subpath}`
    }
    if (ref && ref !== 'main' && ref !== 'master') {
      result += `#${ref}`
    }
    return result
  }

  return 'Invalid URL'
}
