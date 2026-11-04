import type {TemplatePlan} from './types.js'

import {includesCollection} from './collections.js'

interface JunctionRelation {
  collection: string
  meta?: {
    junction_field?: null | string
  }
  related_collection?: null | string
}

// Directus sets meta.junction_field on both FK legs of an M2M to point to the other FK.
// Any collection appearing as `collection` on such a relation is a junction table.
// System collections (directus_*) always exist on every instance — never treat them as broken FK targets.
export function getBrokenJunctionCollections(relations: JunctionRelation[], plan?: TemplatePlan): Set<string> {
  if (!plan?.partial) return new Set()

  const junctionCollections = new Set(relations.filter((r) => r.meta?.junction_field).map((r) => r.collection))

  const broken = new Set<string>()
  for (const junction of junctionCollections) {
    const targets = relations
      .filter((r) => r.collection === junction && r.related_collection)
      .map((r) => r.related_collection as string)

    if (targets.some((target) => !target.startsWith('directus_') && !includesCollection(target, plan))) {
      broken.add(junction)
    }
  }

  return broken
}
