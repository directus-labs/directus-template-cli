import type {TemplateMetadata, TemplatePlan} from './types.js'

import {componentNames} from './flags.js'

function intersectCollections(requested?: string[], available?: string[]): string[] | undefined {
  if (requested && available) {
    const collections = requested.filter((collection) => available.includes(collection))
    return collections.length > 0 ? collections : undefined
  }

  return requested || available
}

function mergeExcludedCollections(requested?: string[], available?: string[]): string[] | undefined {
  const values = [...(requested || []), ...(available || [])]
  return values.length > 0 ? [...new Set(values)] : undefined
}

export function applyMetadataToPlan(plan: TemplatePlan, metadata?: TemplateMetadata): TemplatePlan {
  if (!metadata) return plan

  const components = {...plan.components}
  for (const component of componentNames) {
    components[component] = components[component] && metadata.components[component]
  }

  const partial =
    metadata.partial || componentNames.some((component) => components[component] !== plan.components[component])

  return {
    ...plan,
    collections: intersectCollections(plan.collections, metadata.collections),
    components,
    excludeCollections: mergeExcludedCollections(plan.excludeCollections, metadata.excludedCollections),
    partial,
    schemaCollections: intersectCollections(plan.schemaCollections, metadata.schemaCollections),
  }
}
