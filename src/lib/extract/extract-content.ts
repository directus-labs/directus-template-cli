import {readCollections, readItems, readRelations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import {includesCollection, type TemplatePlan, type TemplateWarning} from '../template-plan/index.js'
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

function getJunctionCollectionsWithBrokenFKs(relations: RelationInfo[], plan?: TemplatePlan): Set<string> {
  if (!plan?.partial) return new Set()

  // Directus sets meta.junction_field on both FK legs of an M2M to point to the other FK.
  // Any collection appearing as `collection` on such a relation is a junction table.
  const junctionCollections = new Set(relations.filter((r) => r.meta?.junction_field).map((r) => r.collection))

  const broken = new Set<string>()
  for (const junction of junctionCollections) {
    const targets = relations
      .filter((r) => r.collection === junction && r.related_collection)
      .map((r) => r.related_collection as string)

    // System collections always exist on every instance — never treat them as broken FK targets.
    if (targets.some((target) => !target.startsWith('directus_') && !includesCollection(target, plan))) {
      broken.add(junction)
    }
  }

  return broken
}

async function getCollections(relations: RelationInfo[], plan?: TemplatePlan) {
  const response = await api.client.request(readCollections())
  const brokenJunctions = getJunctionCollectionsWithBrokenFKs(relations, plan)
  return response
    .filter((item) => !item.collection.startsWith('directus_', 0))
    .filter((item) => item.schema !== null)
    .map((i) => i.collection)
    .filter((collection) => includesCollection(collection, plan))
    .filter((collection) => !brokenJunctions.has(collection))
}

async function getCollectionItems(collection: string): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = []
  let page = 1

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const response = (await api.client.request(readItems(collection as never, {limit: PAGE_SIZE, page}))) as Record<
      string,
      unknown
    >[]
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
    const excludedRelations = getExcludedRelationFields(collection, relations, plan)

    if (plan?.relationStrategy === 'empty') {
      emptyExcludedRelations(response, excludedRelations)
    }

    const warnings =
      plan?.relationStrategy === 'preserve' ? getBrokenRelationWarnings(collection, response, excludedRelations) : []

    await writeToFile(`${collection}`, response, `${dir}/content/`)
    return warnings
  } catch (error) {
    catchError(error, {
      context: {collection, function: 'getDataFromCollection'},
      fatal: true,
    })
    return []
  }
}

export async function extractContent(dir: string, plan?: TemplatePlan): Promise<TemplateWarning[]> {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting content'))
  const warnings: TemplateWarning[] = []

  try {
    const relations = (await api.client.request(readRelations())) as RelationInfo[]
    const collections = await getCollections(relations, plan)

    for (const collection of collections) {
      // eslint-disable-next-line no-await-in-loop
      const collectionWarnings = await getDataFromCollection(collection, dir, relations, plan)
      warnings.push(...collectionWarnings)
    }
  } catch (error) {
    catchError(error, {
      context: {function: 'extractContent'},
      fatal: true,
    })
  }

  ux.action.stop()
  return warnings
}
