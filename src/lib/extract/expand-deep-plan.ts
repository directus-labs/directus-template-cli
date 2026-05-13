import {readCollections, readRelations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk.js'
import {includesCollection, type TemplatePlan} from '../template-plan/index.js'

interface RelationInfo {
  collection: string
  meta?: {
    one_allowed_collections?: null | string[]
    one_field?: null | string
  }
  related_collection?: null | string
}

export async function expandDeepPlan(plan: TemplatePlan): Promise<TemplatePlan> {
  if (!plan.partial || plan.relationStrategy !== 'deep' || !plan.collections) return plan

  const collections = await api.client.request(readCollections())
  const availableCollections = collections
    .filter((collection) => !collection.collection.startsWith('directus_', 0))
    .filter((collection) => collection.schema !== null)
    .map((collection) => collection.collection)
    .filter((collection) => includesCollection(collection, {...plan, collections: undefined}))

  const available = new Set(availableCollections)
  const missingCollections = plan.collections.filter((collection) => !available.has(collection))
  if (missingCollections.length > 0) {
    ux.warn(`Requested collections not found or excluded: ${missingCollections.join(', ')}`)
  }

  const selected = new Set(plan.collections.filter((collection) => available.has(collection)))
  const relations = (await api.client.request(readRelations())) as RelationInfo[]

  let changed = true
  while (changed) {
    changed = false
    const candidates: string[] = []

    for (const relation of relations) {
      if (selected.has(relation.collection) && relation.related_collection) {
        candidates.push(relation.related_collection)
      }

      if (relation.related_collection && selected.has(relation.related_collection)) {
        candidates.push(relation.collection)
      }

      if (selected.has(relation.collection) && relation.meta?.one_allowed_collections) {
        candidates.push(...relation.meta.one_allowed_collections)
      }
    }

    for (const collection of candidates) {
      if (!available.has(collection)) continue
      if (selected.has(collection)) continue

      selected.add(collection)
      changed = true
    }
  }

  const expandedCollections = [...selected]
  const addedCollections = expandedCollections.filter((collection) => !plan.collections?.includes(collection))

  if (addedCollections.length > 0) {
    ux.warn(`Deep relation strategy expanded collections: ${addedCollections.join(', ')}`)
  }

  return {
    ...plan,
    collections: expandedCollections,
  }
}
