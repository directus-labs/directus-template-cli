import {componentNames} from './flags.js'
import type {TemplateMetadata, TemplatePlan} from './types.js'

function intersectCollections(requested?: string[], available?: string[]): string[] | undefined {
  if (requested && available) return requested.filter(collection => available.includes(collection))
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

  return {
    ...plan,
    collections: intersectCollections(plan.collections, metadata.collections),
    components,
    excludeCollections: mergeExcludedCollections(plan.excludeCollections, metadata.excludedCollections),
    partial: plan.partial || metadata.partial,
  }
}
