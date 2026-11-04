import type {TemplatePlan} from './types.js'

export function includesCollection(collection: string, plan?: TemplatePlan): boolean {
  if (plan?.collections && !plan.collections.includes(collection)) return false
  if (plan?.excludeCollections?.includes(collection)) return false
  return true
}

export function includesSchemaCollection(collection: string, plan?: TemplatePlan): boolean {
  const schemaCollections = plan?.schemaCollections || plan?.collections
  if (schemaCollections && !schemaCollections.includes(collection)) return false
  if (plan?.excludeCollections?.includes(collection)) return false
  return true
}

export function includesRelation(collection: string, relatedCollection?: null | string, plan?: TemplatePlan): boolean {
  if (!includesSchemaCollection(collection, plan)) return false
  if (!relatedCollection) return true
  if (plan?.excludeCollections?.includes(relatedCollection)) return plan.relationStrategy === 'preserve'
  if (relatedCollection.startsWith('directus_')) return true
  return includesSchemaCollection(relatedCollection, plan)
}
