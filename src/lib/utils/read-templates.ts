import fs from 'node:fs'
import path from 'pathe'

import {readTemplateConfig} from './template-config.js'

interface Template {
  directoryPath: string;
  templateName: string;
}

export async function readTemplate(
  directoryPath: string,
): Promise<null | Template> {
  const packageFilePath = path.join(directoryPath, 'package.json')

  try {
    const packageData = await fs.promises.readFile(packageFilePath, 'utf8')
    const packageJson: { templateName?: string } = JSON.parse(packageData)

    if (packageJson.templateName) {
      return {
        directoryPath,
        templateName: packageJson.templateName,
      }
    }

    return null
  } catch {
    // console.error(
    //   `Failed to read package.json file in directory ${directoryPath}: ${error}`,
    // )
    return null
  }
}

export async function readAllTemplates(
  directoryPath: string,
): Promise<Template[]> {
  const templates: Template[] = []

  const files = await fs.promises.readdir(directoryPath)

  for (const file of files) {
    const filePath = path.join(directoryPath, file)
    const stats = await fs.promises.stat(filePath)

    if (stats.isDirectory()) {
      const template = await readTemplate(filePath)
      if (template) {
        templates.push(template)
      } else {
        templates.push(...(await readStarterTemplates(filePath)))
      }
    }
  }

  return templates
}

/**
 * Read the Directus templates of a starter (a folder whose package.json has `directus:template`),
 * including its variants. Blank starters (`template: null`) have none.
 * @param directoryPath - The starter folder
 * @returns The starter's templates
 */
export async function readStarterTemplates(directoryPath: string): Promise<Template[]> {
  const config = readTemplateConfig(directoryPath)?.config
  if (!config) return []

  const templatePaths = [config.template, ...Object.values(config.variants || {}).map(variant => variant.template)]

  const templates: Template[] = []

  for (const templatePath of templatePaths) {
    if (!templatePath) continue

    const templateDir = path.join(directoryPath, templatePath)
    if (!fs.existsSync(path.join(templateDir, 'src'))) continue

    // Like any other template, it needs its own package.json with "templateName" to be applied from a URL
    const template = await readTemplate(templateDir)
    if (template) templates.push(template)
  }

  return templates
}
