import {downloadTemplate} from 'giget'
import fs from 'node:fs'
import path from 'node:path'

import {COMMUNITY_TEMPLATE_REPO} from '../constants'
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
    const {dir} = await downloadTemplate(COMMUNITY_TEMPLATE_REPO.string, {
      dir: downloadDir,
      force: true,
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

export async function getInteractiveLocalTemplate(localTemplateDir: string): Promise<Template[]> {
  const resolvedDir = resolvePathAndCheckExistence(localTemplateDir)

  if (!resolvedDir) {
    throw new Error('Directory does not exist.')
  }

  const directTemplate = await readTemplate(resolvedDir)
  if (directTemplate) {
    return [directTemplate]
  }

  const templates = await readAllTemplates(resolvedDir)

  if (templates.length === 0) {
    // If no templates found, search nested directories
    const nestedTemplates = await findNestedTemplates(resolvedDir, 2)

    if (nestedTemplates.length === 0) {
      throw new Error('No valid templates found in the specified directory or its subdirectories.')
    }

    return nestedTemplates
  }

  return templates
}

async function findNestedTemplates(dir: string, depth: number): Promise<Template[]> {
  if (depth === 0) return []

  const templates: Template[] = []
  const entries = await fs.promises.readdir(dir, {withFileTypes: true})

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dir, entry.name)
      const dirTemplates = await readAllTemplates(fullPath)
      templates.push(...dirTemplates)

      if (dirTemplates.length === 0 && depth > 1) {
        // If no templates found and we can go deeper, search subdirectories
        const nestedTemplates = await findNestedTemplates(fullPath, depth - 1)
        templates.push(...nestedTemplates)
      }
    }
  }

  return templates
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
