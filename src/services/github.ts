import {ux} from '@oclif/core'
import {Octokit} from '@octokit/rest'
import {Buffer} from 'node:buffer'

import {DEFAULT_REPO} from '../lib/constants.js'
import {parseGitHubUrl} from '../lib/utils/parse-github-url.js'

interface GitHubUrlParts {
  owner: string
  path?: string
  ref?: string
  repo: string
}

export interface TemplateInfo {
  description?: string
  id: string
  name: string
}

export interface GitHubService {
  getTemplateDirectories(template: string, customUrl?: string): Promise<string[]>
  getTemplates(customUrl?: string): Promise<TemplateInfo[]>
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
          path: repo.path || '',
          ref: repo.ref,
          repo: repo.repo,
        })

        if (!Array.isArray(data)) return []

        // For direct URLs, we don't filter out the directus directory
        // as the entire repo might be a directus template
        return data
        .filter(item => item.type === 'dir')
        .map(item => item.name)
      } catch {
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
    } catch {
      // If we can't get contents, return empty array
      return []
    }
  }

  /**
   * Get the templates for a repository, including name and description from package.json.
   * Ensures 'blank' template appears last if found.
   * If a direct URL to a template directory is provided, attempt to fetch its package.json.
   * @param customUrl - The custom URL or base repository URL to get the templates for.
   * @returns The templates for the repository with details, sorted.
   */
  async function getTemplates(customUrl?: string): Promise<TemplateInfo[]> {
    // Handle direct URLs pointing to a specific template directory
    if (customUrl?.startsWith('http')) {
      const parsed = parseGitHubUrl(customUrl)
      let name = parsed.path?.split('/').pop() || parsed.repo
      let description: string | undefined
      const packageJsonPath = joinPath(parsed.path || '', 'package.json')

      try {
        const {data: packageJsonContent} = await octokit.rest.repos.getContent({
          mediaType: {
            format: 'raw',
          },
          owner: parsed.owner,
          path: packageJsonPath,
          ref: parsed.ref,
          repo: parsed.repo,
        })

        // getContent with mediaType: raw returns string directly
        if (typeof packageJsonContent === 'string') {
          const packageJson = JSON.parse(packageJsonContent)
          const templateConfig = packageJson?.['directus:template']

          if (templateConfig?.name) {
            name = templateConfig.name
          }

          if (templateConfig?.description) {
            description = templateConfig.description
          }
        }
      } catch (error: any) {
        // If package.json is missing or fails to parse, just use the default name derived from the URL.
        // Don't warn here as it might be expected that a direct URL doesn't have this structure.
        if (error.status !== 404) {
          // Log other errors if needed for debugging, but don't show to user unless verbose?
           console.error(`Error fetching package.json for direct URL ${customUrl}: ${error.message}`)
        }
      }

      // Return a single item array for the direct URL case
      return [{description, id: customUrl, name}]
    }

    const repo = customUrl ? parseGitHubUrl(customUrl) : DEFAULT_REPO

    const {data: rootContent} = await octokit.rest.repos.getContent({
      owner: repo.owner,
      path: repo.path || '',
      ref: repo.ref,
      repo: repo.repo,
    })

    if (!Array.isArray(rootContent)) return []

    const directories = rootContent.filter(item => item.type === 'dir')

    // Fetch package.json for each directory concurrently
    const templateInfos = await Promise.all(
      directories.map(async (dir): Promise<TemplateInfo> => {
        const packageJsonPath = joinPath(repo.path || '', dir.path, 'package.json')
        let {name} = dir
        let description: string | undefined

        try {
          const {data: packageJsonContent} = await octokit.rest.repos.getContent({
            mediaType: {
              format: 'raw',
            },
            owner: repo.owner,
            path: packageJsonPath,
            ref: repo.ref,
            repo: repo.repo,
          })

          // getContent with mediaType: raw returns string directly
          if (typeof packageJsonContent === 'string') {
            const packageJson = JSON.parse(packageJsonContent)
            const templateConfig = packageJson?.['directus:template']

            if (templateConfig?.name) {
              name = templateConfig.name
            }

            if (templateConfig?.description) {
              description = templateConfig.description
            }
          }
        } catch (error: any) {
          // Handle cases where package.json is missing or fails to parse
          if (error.status !== 404) {
            ux.warn(`Could not fetch or parse package.json for template "${dir.name}": ${error.message}`)
          }
        }

        return {
          description,
          id: dir.name,
          name,
        }
      })
    )

    // Sort the templates to put "blank" last
    templateInfos.sort((a, b) => {
      const aIsBlank = a.id.toLowerCase() === 'blank' || a.name.toLowerCase() === 'blank'
      const bIsBlank = b.id.toLowerCase() === 'blank' || b.name.toLowerCase() === 'blank'

      if (aIsBlank && !bIsBlank) return 1 // a comes AFTER b
      if (!aIsBlank && bIsBlank) return -1 // a comes BEFORE b

      return a.name.localeCompare(b.name)
    })

    return templateInfos
  }

  return {
    getTemplateDirectories,
    getTemplates,
    parseGitHubUrl,
  }
}

// Helper functions
function joinPath(...segments: (string | undefined)[]): string {
  return segments.filter(Boolean).join('/')
}
