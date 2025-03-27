import {Octokit} from '@octokit/rest'

import {DEFAULT_REPO} from '../lib/constants.js'
import {parseGitHubUrl} from '../lib/utils/parse-github-url.js'

interface GitHubUrlParts {
  owner: string
  path?: string
  ref?: string
  repo: string
}

export interface GitHubService {
  getTemplateDirectories(template: string, customUrl?: string): Promise<string[]>
  getTemplates(customUrl?: string): Promise<string[]>
  parseGitHubUrl(url: string): GitHubUrlParts
}

export function createGitHub(token?: string) {
  const octokit = new Octokit({
    auth: token,
  })

  /**
   * Get the directories for a template.
   * @param template - The template to get the directories for.
   * @param customUrl - The custom URL to get the directories for.
   * @returns The directories for the template.
   */
  async function getTemplateDirectories(template: string, customUrl?: string): Promise<string[]> {
    // If template is a URL, parse it directly
    if (template.startsWith('http')) {
      const repo = parseGitHubUrl(template)
      try {
        const {data} = await octokit.rest.repos.getContent({
          owner: repo.owner,
          repo: repo.repo,
          path: repo.path || '',
          ref: repo.ref,
        })

        if (!Array.isArray(data)) return []

        // For direct URLs, we don't filter out the directus directory
        // as the entire repo might be a directus template
        return data
        .filter(item => item.type === 'dir')
        .map(item => item.name)
      } catch (error) {
        // If we can't get contents, return empty array
        // This indicates no frontends are available
        return []
      }
    }

    // Otherwise use default repo behavior
    const repo = customUrl ? parseGitHubUrl(customUrl) : DEFAULT_REPO
    const templatePath = repo.path ? `${repo.path}/${template}` : template

    try {
      const {data} = await octokit.rest.repos.getContent({
        owner: repo.owner,
        path: templatePath,
        ref: repo.ref,
        repo: repo.repo,
      })

      if (!Array.isArray(data)) return []

      return data
      .filter(item => item.type === 'dir' && item.name !== 'directus')
      .map(item => item.name)
    } catch (error) {
      // If we can't get contents, return empty array
      return []
    }
  }

  /**
   * Get the templates for a repository.
   * @param customUrl - The custom URL to get the templates for.
   * @returns The templates for the repository.
   */
  async function getTemplates(customUrl?: string): Promise<string[]> {
    // If customUrl is provided and it's a full repository URL, return it as the only template
    if (customUrl?.startsWith('http')) {
      return [customUrl]
    }

    const repo = customUrl ? parseGitHubUrl(customUrl) : DEFAULT_REPO

    const {data} = await octokit.rest.repos.getContent({
      owner: repo.owner,
      path: repo.path || '',
      ref: repo.ref,
      repo: repo.repo,
    })

    if (!Array.isArray(data)) return []

    return data
    .filter(item => item.type === 'dir')
    .map(item => item.name)
  }

  return {
    getTemplateDirectories,
    getTemplates,
    parseGitHubUrl,
  }
}
