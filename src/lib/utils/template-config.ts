import fs from 'node:fs'
import path from 'pathe'

import type {DirectusTemplateConfig, TemplatePackageJson} from '../types.js'

export interface TemplateVariantOption {
  description?: string
  id: string
  name: string
  requiresLicense: boolean
  template: string
}

export interface TemplateInfo {
  config: DirectusTemplateConfig
  frontendOptions: Array<{
    id: string
    name: string
    path: string
  }>
  variantOptions: TemplateVariantOption[]
}

/**
 * Get the Directus template path for a variant, or the default template when no variant is given
 * @param config Template configuration from package.json
 * @param variant Variant key from directus:template.variants
 * @returns Template path relative to the starter root, or null for blank starters
 * @throws Error if the variant doesn't exist
 */
export function getTemplatePath(config: DirectusTemplateConfig, variant?: string): null | string {
  if (!variant) return config.template

  const selected = config.variants?.[variant]
  if (!selected) {
    const available = Object.keys(config.variants || {}).join(', ') || 'none'
    throw new Error(`Variant "${variant}" not found in template configuration. Available variants: ${available}`)
  }

  return selected.template
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

    const variantOptions = Object.entries(templateConfig.variants || {}).map(([id, variant]) => ({
      description: variant.description,
      id,
      name: variant.name,
      requiresLicense: Boolean(variant.requiresLicense),
      template: variant.template,
    }))

    return {
      config: templateConfig,
      frontendOptions,
      variantOptions,
    }
  } catch {
    return null
  }
}
