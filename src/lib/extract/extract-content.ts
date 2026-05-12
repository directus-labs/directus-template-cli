import {readCollections, readItems, readRelations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import {includesCollection, type TemplatePlan, type TemplateWarning} from '../template-plan/index.js'
import catchError from '../utils/catch-error.js'
import writeToFile from '../utils/write-to-file.js'

interface RelationInfo {
  collection: string
  field: string
  related_collection?: string
}

async function getCollections(plan?: TemplatePlan) {
  const response = await api.client.request(readCollections())
  return response
    .filter((item) => !item.collection.startsWith('directus_', 0))
    .filter((item) => item.schema !== null)
    .map((i) => i.collection)
    .filter((collection) => includesCollection(collection, plan))
}

function getExcludedRelationFields(collection: string, relations: RelationInfo[], plan?: TemplatePlan): RelationInfo[] {
  if (!plan?.partial || plan.relationStrategy === 'deep') return []

  return relations.filter((relation) =>
    relation.collection === collection &&
    relation.related_collection &&
    !includesCollection(relation.related_collection, plan),
  )
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0
  return value !== null && value !== undefined
}

function emptyExcludedRelations(items: Record<string, unknown>[], relations: RelationInfo[]): void {
  for (const item of items) {
    for (const relation of relations) {
      if (!(relation.field in item)) continue
      item[relation.field] = Array.isArray(item[relation.field]) ? [] : null
    }
  }
}

function getBrokenRelationWarnings(
  collection: string,
  items: Record<string, unknown>[],
  relations: RelationInfo[],
): TemplateWarning[] {
  return relations
    .map((relation) => ({
      collection,
      count: items.filter((item) => hasValue(item[relation.field])).length,
      field: relation.field,
      relatedCollection: relation.related_collection,
      type: 'excluded_relation',
    }))
    .filter((warning) => warning.count > 0)
}

async function getDataFromCollection(
  collection: string,
  dir: string,
  relations: RelationInfo[],
  plan?: TemplatePlan,
): Promise<TemplateWarning[]> {
  try {
    const response = await api.client.request(readItems(collection as never, {limit: -1})) as Record<string, unknown>[]
    const excludedRelations = getExcludedRelationFields(collection, relations, plan)

    if (plan?.relationStrategy === 'empty') {
      emptyExcludedRelations(response, excludedRelations)
    }

    const warnings = plan?.relationStrategy === 'ids'
      ? getBrokenRelationWarnings(collection, response, excludedRelations)
      : []

    await writeToFile(`${collection}`, response, `${dir}/content/`)
    return warnings
  } catch (error) {
    catchError(error)
    return []
  }
}

export async function extractContent(dir: string, plan?: TemplatePlan): Promise<TemplateWarning[]> {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting content'))
  try {
    const collections = await getCollections(plan)
    const relations = await api.client.request(readRelations()) as RelationInfo[]
    const warnings = await Promise.all(
      collections.map((collection) => getDataFromCollection(collection, dir, relations, plan)),
    )
    ux.action.stop()
    return warnings.flat()
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
  return []
}
