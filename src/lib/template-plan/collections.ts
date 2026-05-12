import type {TemplatePlan} from './types.js'

export function includesCollection(collection: string, plan?: TemplatePlan): boolean {
  if (plan?.collections && !plan.collections.includes(collection)) return false
  if (plan?.excludeCollections?.includes(collection)) return false
  return true
}

export function includesRelation(collection: string, relatedCollection?: null | string, plan?: TemplatePlan): boolean {
  if (!includesCollection(collection, plan)) return false
  if (!relatedCollection) return true
  if (plan?.relationStrategy === 'ids') return true
  return includesCollection(relatedCollection, plan)
}
