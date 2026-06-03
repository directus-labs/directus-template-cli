import type {TemplateMetadata, TemplatePlan} from './types.js'

import catchError from '../utils/catch-error.js'
import {componentNames} from './flags.js'

function intersectCollections(
  scope: string,
  requested?: string[],
  available?: string[],
): string[] | undefined {
  if (requested && available) {
    const collections = requested.filter((collection) => available.includes(collection))
    if (collections.length === 0) {
      catchError(new Error(`No requested ${scope} match this template`), {fatal: true})
    }

    return collections
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
    plan.partial ||
    metadata.partial ||
    componentNames.some((component) => components[component] !== plan.components[component])

  return {
    ...plan,
    collections: intersectCollections('collections', plan.collections, metadata.collections),
    components,
    excludeCollections: mergeExcludedCollections(plan.excludeCollections, metadata.excludedCollections),
    partial,
    relationStrategy: metadata.relationStrategy ?? plan.relationStrategy,
    schemaCollections: intersectCollections('schema collections', plan.schemaCollections, metadata.schemaCollections),
  }
}
