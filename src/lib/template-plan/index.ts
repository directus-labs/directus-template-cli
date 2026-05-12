import type {RelationStrategy, TemplateComponents, TemplatePlan} from './types.js'

import catchError from '../utils/catch-error.js'
import {componentNames} from './flags.js'

function parseList(value?: string | string[]): string[] | undefined {
  if (!value) return undefined
  const raw = Array.isArray(value) ? value.join(',') : value
  const values = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return values.length > 0 ? values : undefined
}

function hasPartialOnlyFlags(flags: any): boolean {
  return Boolean(
    flags.collections ||
    flags.excludeCollections ||
    flags.noAssets === true ||
    flags.relationStrategy !== undefined ||
    flags.allowBrokenRelations === true,
  )
}

function hasComponentFlags(flags: any): boolean {
  return componentNames.some((component) => flags[component] !== undefined)
}

function buildComponents(flags: any, partial: boolean): TemplateComponents {
  const components = {} as TemplateComponents
  const enabled = componentNames.filter((component) => flags[component] === true)
  const disabled = componentNames.filter((component) => flags[component] === false)

  if (!partial) {
    for (const component of componentNames) components[component] = true
    return components
  }

  if (enabled.length > 0) {
    for (const component of componentNames) components[component] = enabled.includes(component)
  } else if (disabled.length > 0) {
    for (const component of componentNames) components[component] = !disabled.includes(component)
  } else {
    for (const component of componentNames) components[component] = true
  }

  if (flags.noAssets) components.files = false

  return components
}

export function buildTemplatePlan(flags: any = {}): TemplatePlan {
  const collections = parseList(flags.collections)
  const excludeCollections = parseList(flags.excludeCollections) || (flags.noAssets ? [] : undefined)
  if (flags.noAssets && !excludeCollections?.includes('directus_files')) {
    excludeCollections?.push('directus_files')
  }

  const partial = Boolean(flags.partial || hasComponentFlags(flags) || hasPartialOnlyFlags(flags))
  const components = buildComponents(flags, partial)

  if (!componentNames.some((component) => components[component])) {
    catchError(new Error('At least one template component must be enabled.'), {fatal: true})
  }

  return {
    allowBrokenRelations: Boolean(flags.allowBrokenRelations),
    collections,
    components,
    excludeCollections,
    partial,
    relationStrategy: (flags.relationStrategy || (partial ? 'ids' : 'deep')) as RelationStrategy,
  }
}

export * from './flags.js'
export * from './metadata.js'
export * from './types.js'
