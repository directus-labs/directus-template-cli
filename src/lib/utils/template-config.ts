import fs from 'node:fs'
import path from 'pathe'

import type {DirectusTemplateConfig, TemplatePackageJson} from '../types.js'

export interface TemplateInfo {
  config: DirectusTemplateConfig
  frontendOptions: Array<{
    id: string
    name: string
    path: string
  }>
}

/**
 * Read and validate the template configuration from a directory
 * @param dir Directory containing the template
 * @returns Template configuration and frontend options
 * @throws Error if package.json is missing or invalid
 */
export function readTemplateConfig(dir: string): null | TemplateInfo {
  try {
    const packageJsonPath = path.join(dir, 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      return null
    }

    const packageJson: TemplatePackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    const templateConfig = packageJson['directus:template']

    if (!templateConfig) {
      return null
    }

    // Convert frontends object to array of options
    const frontendOptions = Object.entries(templateConfig.frontends || {}).map(([id, frontend]) => ({
      id,
      name: frontend.name,
      path: frontend.path.replace(/^\.\//, ''), // Remove leading ./
    }))

    return {
      config: templateConfig,
      frontendOptions,
    }
  } catch {
    return null
  }
}
