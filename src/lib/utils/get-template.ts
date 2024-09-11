import {downloadTemplate} from 'giget'
import path from 'node:path'

import resolvePathAndCheckExistence from './path'
import {readAllTemplates, readTemplate} from './read-templates'
import {transformGitHubUrl} from './transform-github-url'

interface Template {
  directoryPath: string;
  templateName: string;
}

export async function getCommunityTemplates(): Promise<Template[]> {
  const downloadDir = resolvePathAndCheckExistence(path.join(__dirname, '..', 'downloads', 'official'), false)

  if (!downloadDir) {
    throw new Error(`Invalid download directory: ${path.join(__dirname, '..', 'downloads', 'official')}`)
  }

  try {
    const {dir} = await downloadTemplate('github:directus-labs/directus-templates', {
      dir: downloadDir,
      force: true,
      preferOffline: true,
    })

    return await readAllTemplates(dir)
  } catch (error) {
    throw new Error(`Failed to download community templates: ${error}`)
  }
}

export async function getLocalTemplate(localTemplateDir: string): Promise<Template> {
  const resolvedDir = resolvePathAndCheckExistence(localTemplateDir)

  if (!resolvedDir) {
    throw new Error('Directory does not exist.')
  }

  return readTemplate(resolvedDir)
}

export async function getGithubTemplate(ghTemplateUrl: string): Promise<Template> {
  try {
    const ghString = await transformGitHubUrl(ghTemplateUrl)
    const downloadDir = resolvePathAndCheckExistence(path.join(__dirname, '..', 'downloads', 'github'), false)

    if (!downloadDir) {
      throw new Error(`Invalid download directory: ${path.join(__dirname, '..', 'downloads', 'github')}`)
    }

    const {dir} = await downloadTemplate(ghString, {
      dir: downloadDir,
      force: true,
      forceClean: true,
    })

    const resolvedDir = resolvePathAndCheckExistence(dir)
    if (!resolvedDir) {
      throw new Error(`Downloaded template directory does not exist: ${dir}`)
    }

    return readTemplate(resolvedDir)
  } catch (error) {
    throw new Error(`Failed to download GitHub template: ${error}`)
  }
}
