import {readCollections, readRelations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk.js'
import {includesCollection, type TemplatePlan} from '../template-plan/index.js'

interface CollectionInfo {
  collection: string
  meta?: {
    group?: null | string
  }
  schema?: null | Record<string, unknown>
}

interface RelationInfo {
  collection: string
  meta?: {
    one_allowed_collections?: null | string[]
    one_field?: null | string
  }
  related_collection?: null | string
}

export async function expandSchemaPlan(plan: TemplatePlan): Promise<TemplatePlan> {
  if (!plan.partial || !plan.collections) return plan

  const collections = (await api.client.request(readCollections())) as CollectionInfo[]
  const availableCollections = collections
    .filter((collection) => !collection.collection.startsWith('directus_', 0))
    .map((collection) => collection.collection)
    .filter((collection) => includesCollection(collection, {...plan, collections: undefined}))
  const collectionMap = new Map(collections.map((collection) => [collection.collection, collection]))

  const available = new Set(availableCollections)
  const selected = new Set(plan.collections.filter((collection) => available.has(collection)))
  const relations = (await api.client.request(readRelations())) as RelationInfo[]

  let changed = true
  while (changed) {
    changed = false

    const candidates: string[] = []

    for (const collection of selected) {
      const group = collectionMap.get(collection)?.meta?.group
      if (group) candidates.push(group)
    }

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

  const schemaCollections = [...selected]
  const addedCollections = schemaCollections.filter((collection) => !plan.collections?.includes(collection))

  if (addedCollections.length > 0) {
    ux.warn(`Schema scope expanded collections: ${addedCollections.join(', ')}`)
  }

  return {
    ...plan,
    schemaCollections,
  }
}
