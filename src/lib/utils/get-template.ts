import {downloadTemplate} from 'giget'
import fs from 'node:fs'
import {fileURLToPath} from 'node:url'
import path, {dirname} from 'pathe'

import {COMMUNITY_TEMPLATE_REPO} from '../constants.js'
import {logger} from './logger.js'
import resolvePathAndCheckExistence from './path.js'
import {readAllTemplates, readTemplate} from './read-templates.js'
import {parseGitHubUrl, transformGitHubUrl} from './transform-github-url.js'

// Create __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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

async function downloadGithubTemplate(ghTemplateUrl: string): Promise<string> {
  const ghString = transformGitHubUrl(ghTemplateUrl)
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

  return resolvedDir
}

function buildSubpathUrl(ghTemplateUrl: string, templatePath: string): string {
  const {owner, ref, repo} = parseGitHubUrl(ghTemplateUrl)
  const normalizedPath = templatePath.split(path.sep).join('/')
  return `https://github.com/${owner}/${repo}/tree/${ref || 'main'}/${normalizedPath}`
}

export async function getGithubTemplate(ghTemplateUrl: string): Promise<Template> {
  try {
    const resolvedDir = await downloadGithubTemplate(ghTemplateUrl)

    const template = await readTemplate(resolvedDir)
    if (template) {
      return template
    }

    const nested = await findNestedTemplates(resolvedDir, 3)

    if (nested.length === 1) {
      const subpath = path.relative(resolvedDir, nested[0].directoryPath)
      const pinnedUrl = buildSubpathUrl(ghTemplateUrl, subpath)
      logger.log(
        'warn',
        `Auto-selected nested template "${nested[0].templateName}" at ${subpath}. Pin --templateLocation="${pinnedUrl}" to avoid ambiguity if more templates are added.`,
      )
      return nested[0]
    }

    if (nested.length > 1) {
      const list = nested
        .map(t => {
          const subpath = path.relative(resolvedDir, t.directoryPath)
          return `  --templateLocation="${buildSubpathUrl(ghTemplateUrl, subpath)}"   # ${t.templateName}`
        })
        .join('\n')
      throw new Error(
        `Found multiple Directus templates in ${ghTemplateUrl}. Re-run with one of:\n${list}`,
      )
    }

    throw new Error(
      `No Directus template found at ${ghTemplateUrl}. A Directus template needs a package.json with a "templateName" field.`,
    )
  } catch (error) {
    throw new Error(`Failed to download GitHub template: ${error}`)
  }
}

export async function getInteractiveGithubTemplate(ghTemplateUrl: string): Promise<Template[]> {
  try {
    const resolvedDir = await downloadGithubTemplate(ghTemplateUrl)

    const template = await readTemplate(resolvedDir)
    if (template) {
      return [template]
    }

    const nested = await findNestedTemplates(resolvedDir, 3)

    if (nested.length === 0) {
      throw new Error(
        `No Directus template found at ${ghTemplateUrl}. A Directus template needs a package.json with a "templateName" field.`,
      )
    }

    return nested
  } catch (error) {
    throw new Error(`Failed to download GitHub template: ${error}`)
  }
}
