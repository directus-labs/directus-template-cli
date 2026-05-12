import {readCollections, readRelations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk.js'
import {includesCollection, type TemplatePlan} from '../template-plan/index.js'
import catchError from '../utils/catch-error.js'

interface RelationInfo {
  collection: string
  related_collection?: null | string
}

export async function expandDeepPlan(plan: TemplatePlan): Promise<TemplatePlan> {
  if (!plan.partial || plan.relationStrategy !== 'deep' || !plan.collections) return plan

  try {
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
    const relations = await api.client.request(readRelations()) as RelationInfo[]

    let changed = true
    while (changed) {
      changed = false

      for (const relation of relations) {
        if (!relation.related_collection) continue
        if (!selected.has(relation.collection)) continue
        if (!available.has(relation.related_collection)) continue
        if (selected.has(relation.related_collection)) continue

        selected.add(relation.related_collection)
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
  } catch (error) {
    catchError(error, {fatal: true})
  }
}
