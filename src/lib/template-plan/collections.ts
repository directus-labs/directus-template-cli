import type {TemplatePlan} from './types.js'

export function includesCollection(collection: string, plan?: TemplatePlan): boolean {
  if (plan?.collections && !plan.collections.includes(collection)) return false
  if (plan?.excludeCollections?.includes(collection)) return false
  return true
}
