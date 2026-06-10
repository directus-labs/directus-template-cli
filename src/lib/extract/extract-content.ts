import {readCollections, readItems, readRelations} from '@directus/sdk'
import {Errors, ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import {
  getBrokenJunctionCollections,
  includesCollection,
  type TemplatePlan,
  type TemplateWarning,
} from '../template-plan/index.js'
import catchError from '../utils/catch-error.js'
import writeToFile from '../utils/write-to-file.js'

// Content items are JSON-only, so pages can be larger than asset download pages.
const PAGE_SIZE = 500

interface RelationInfo {
  collection: string
  field: string
  meta?: {
    junction_field?: null | string
    one_field?: null | string
  }
  related_collection?: null | string
}

interface ExcludedRelationField {
  field: string
  relatedCollection: string
  type: 'alias' | 'm2o'
}

async function getCollections(relations: RelationInfo[], plan?: TemplatePlan) {
  const response = await api.client.request(readCollections())
  const brokenJunctions = getBrokenJunctionCollections(relations, plan)
  return response
    .filter((item) => !item.collection.startsWith('directus_', 0))
    .filter((item) => item.schema !== null)
    .map((i) => i.collection)
    .filter((collection) => includesCollection(collection, plan))
    .filter((collection) => !brokenJunctions.has(collection))
}

async function getCollectionItems(
  collection: string,
): Promise<Record<string, unknown> | Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = []
  let page = 1

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const response = (await api.client.request(readItems(collection as never, {limit: PAGE_SIZE, page}))) as
      | Record<string, unknown>
      | Record<string, unknown>[]
    // Singletons return a single object — return it as-is so the file stays an object,
    // matching loadSingletons/updateSingleton on the load side.
    if (!Array.isArray(response)) return response
    items.push(...response)

    if (response.length < PAGE_SIZE) break
    page++
  }

  return items
}

function getExcludedRelationFields(
  collection: string,
  relations: RelationInfo[],
  plan?: TemplatePlan,
): ExcludedRelationField[] {
  if (!plan?.partial || plan.relationStrategy === 'deep') return []

  const m2oFields = relations
    .filter((relation) => relation.collection === collection)
    .filter((relation): relation is RelationInfo & {related_collection: string} => Boolean(relation.related_collection))
    .filter((relation) => !includesCollection(relation.related_collection, plan))
    .map((relation) => ({
      field: relation.field,
      relatedCollection: relation.related_collection,
      type: 'm2o' as const,
    }))

  const aliasFields = relations
    .filter((relation) => relation.related_collection === collection)
    .filter((relation): relation is RelationInfo & {meta: {one_field: string}} => Boolean(relation.meta?.one_field))
    .filter((relation) => !includesCollection(relation.collection, plan))
    .map((relation) => ({
      field: relation.meta.one_field,
      relatedCollection: relation.collection,
      type: 'alias' as const,
    }))

  return [...m2oFields, ...aliasFields]
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0
  return value !== null && value !== undefined
}

function emptyExcludedRelations(items: Record<string, unknown>[], relations: ExcludedRelationField[]): void {
  for (const item of items) {
    for (const relation of relations) {
      if (!(relation.field in item)) continue

      if (relation.type === 'alias') {
        delete item[relation.field]
      } else {
        item[relation.field] = null
      }
    }
  }
}

function getBrokenRelationWarnings(
  collection: string,
  items: Record<string, unknown>[],
  relations: ExcludedRelationField[],
): TemplateWarning[] {
  return relations
    .map(
      (relation): TemplateWarning => ({
        collection,
        count: items.filter((item) => hasValue(item[relation.field])).length,
        field: relation.field,
        relatedCollection: relation.relatedCollection,
        type: 'excluded_relation',
      }),
    )
    .filter((warning) => warning.count > 0)
}

async function getDataFromCollection(
  collection: string,
  dir: string,
  relations: RelationInfo[],
  plan?: TemplatePlan,
): Promise<TemplateWarning[]> {
  try {
    ux.action.status = `Extracting content: ${collection}`
    const response = await getCollectionItems(collection)
    // Relation-stripping works on rows and mutates in place; a singleton is one object,
    // so normalise to an array for those passes but write the original shape.
    const items = Array.isArray(response) ? response : [response]
    const excludedRelations = getExcludedRelationFields(collection, relations, plan)

    if (plan?.relationStrategy === 'empty') {
      emptyExcludedRelations(items, excludedRelations)
    }

    const warnings =
      plan?.relationStrategy === 'preserve' ? getBrokenRelationWarnings(collection, items, excludedRelations) : []

    await writeToFile(`${collection}`, response, `${dir}/content/`)
    return warnings
  } catch (error) {
    catchError(error, {
      context: {collection, function: 'getDataFromCollection'},
      fatal: true,
    })
  }
}

export async function extractContent(dir: string, plan?: TemplatePlan): Promise<TemplateWarning[]> {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting content'))
  const warnings: TemplateWarning[] = []

  try {
    const relations = (await api.client.request(readRelations())) as RelationInfo[]
    const collections = await getCollections(relations, plan)

    for (const collection of collections) {
      // Keep extraction sequential so the shared ux.action.status reflects the active collection.
      // eslint-disable-next-line no-await-in-loop
      const collectionWarnings = await getDataFromCollection(collection, dir, relations, plan)
      warnings.push(...collectionWarnings)
    }
  } catch (error) {
    if (error instanceof Errors.CLIError) throw error

    catchError(error, {
      context: {function: 'extractContent'},
      fatal: true,
    })
  }

  ux.action.stop()
  return warnings
}
