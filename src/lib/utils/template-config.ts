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

export type VariantDecision =
  | {kind: 'ask-license'; licensedVariant: string}
  | {kind: 'ask-variant'}
  | {kind: 'error'; message: string}
  | {kind: 'use'; variant?: string}

function noLicenseConflict(license?: boolean, hasLicenseKey?: boolean, templateRequiresLicense?: boolean): string | undefined {
  if (license !== false) return undefined
  if (hasLicenseKey) return '--no-license and --licenseKey can\'t be used together.'
  if (templateRequiresLicense) return 'This template needs a Directus license, so it can\'t be used with --no-license.'
}

/**
 * Decide which template variant to apply, or what to ask. A template whose only variant needs a license
 * becomes a yes/no license question; anything else falls back to picking from the list. Without a terminal
 * to ask in, the core template is used.
 * @param options Template variants and the related init flags
 * @param options.hasLicenseKey Whether --license-key was given
 * @param options.interactive Whether the user can be asked (stdin is a terminal)
 * @param options.license --license (true), --no-license (false), or not set
 * @param options.templateRequiresLicense Whether the template itself needs a license (cms-i18n)
 * @param options.variant --variant, if given
 * @param options.variantOptions Variants declared by the template
 * @returns The variant to use (undefined = core template), the question to ask, or an error
 */
export function decideVariant(options: {
  hasLicenseKey: boolean
  interactive: boolean
  license?: boolean
  templateRequiresLicense?: boolean
  variant?: string
  variantOptions: TemplateVariantOption[]
}): VariantDecision {
  const {hasLicenseKey, interactive, license, templateRequiresLicense, variant, variantOptions} = options

  const conflict = noLicenseConflict(license, hasLicenseKey, templateRequiresLicense)
  if (conflict) return {kind: 'error', message: conflict}

  if (variant) {
    const selected = variantOptions.find(v => v.id === variant)
    if (!selected) {
      const available = variantOptions.map(v => v.id).join(', ') || 'none'
      return {kind: 'error', message: `Variant "${variant}" isn't available for this template. Available variants: ${available}`}
    }

    if (selected.requiresLicense && license === false) {
      return {kind: 'error', message: `Variant "${variant}" needs a license, so it can't be used with --no-license.`}
    }

    return {kind: 'use', variant}
  }

  if (variantOptions.length === 0 || license === false) return {kind: 'use'}

  const onlyLicensed = variantOptions.length === 1 && variantOptions[0].requiresLicense
  if (onlyLicensed && (license === true || hasLicenseKey)) return {kind: 'use', variant: variantOptions[0].id}
  if (!interactive && (license === true || hasLicenseKey) && !onlyLicensed) {
    return {kind: 'error', message: 'This template has several versions. Pick one with --variant.'}
  }

  if (!interactive) return {kind: 'use'}

  return onlyLicensed ? {kind: 'ask-license', licensedVariant: variantOptions[0].id} : {kind: 'ask-variant'}
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
