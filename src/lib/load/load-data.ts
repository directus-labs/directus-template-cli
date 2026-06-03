import {createItems, readItems, updateItemsBatch, updateSingleton} from '@directus/sdk'
import {ux} from '@oclif/core'
import fs from 'node:fs'
import path from 'pathe'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import {getBrokenJunctionCollections, includesCollection, type TemplatePlan} from '../template-plan/index.js'
import catchError from '../utils/catch-error.js'
import {chunkArray} from '../utils/chunk-array.js'
import readFile from '../utils/read-file.js'

const BATCH_SIZE = 50

export default async function loadData(dir: string, plan?: TemplatePlan) {
  const collections = getUserCollections(dir, plan)
  ux.action.start(ux.colorize(DIRECTUS_PINK, `Loading data for ${collections.length} collections`))

  await loadSkeletonRecords(dir, plan)
  await loadFullData(dir, plan)
  await loadSingletons(dir, plan)

  ux.action.stop()
}

function getContentCollections(dir: string): Set<string> {
  const contentDir = path.resolve(dir, 'content')
  if (!fs.existsSync(contentDir)) return new Set()

  return new Set(
    fs
      .readdirSync(contentDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.basename(file, '.json')),
  )
}

export function getUserCollections(dir: string, plan?: TemplatePlan) {
  const contentCollections = getContentCollections(dir)
  const collections = readFile('collections', dir)
  const relationsPath = path.join(dir, 'relations.json')
  const relations = plan?.partial && fs.existsSync(relationsPath) ? readFile('relations', dir) : []
  const brokenJunctions = getBrokenJunctionCollections(relations, plan)

  if (brokenJunctions.size > 0) {
    ux.warn(`Skipping junction collections with excluded FK targets: ${[...brokenJunctions].join(', ')}`)
  }

  return collections
    .filter((item) => contentCollections.has(item.collection))
    .filter((item) => !item.collection.startsWith('directus_', 0))
    .filter((item) => item.schema !== null)
    .filter((item) => includesCollection(item.collection, plan))
    .filter((item) => !brokenJunctions.has(item.collection))
}

async function loadSkeletonRecords(dir: string, plan?: TemplatePlan) {
  ux.action.status = 'Loading skeleton records'
  const primaryKeyMap = await getCollectionPrimaryKeys(dir)
  const userCollections = getUserCollections(dir, plan).filter((item) => !item.meta.singleton)

  await Promise.all(
    userCollections.map(async (collection) => {
      const name = collection.collection
      const primaryKeyField = getPrimaryKey(primaryKeyMap, name)
      const sourceDir = path.resolve(dir, 'content')
      const data = readFile(name, sourceDir)

      // Fetch existing primary keys
      const existingPrimaryKeys = await getExistingPrimaryKeys(name, primaryKeyField)

      // Filter out existing records
      const newData = data.filter((entry) => !existingPrimaryKeys.has(entry[primaryKeyField]))

      if (newData.length === 0) return

      const batches = chunkArray(newData, BATCH_SIZE).map((batch) =>
        batch.map((entry) => ({[primaryKeyField]: entry[primaryKeyField]})),
      )

      await Promise.all(batches.map((batch) => uploadBatch(name, batch, createItems)))
    }),
  )

  ux.action.status = 'Loaded skeleton records'
}

async function getExistingPrimaryKeys(collection: string, primaryKeyField: string): Promise<Set<any>> {
  const existingKeys = new Set()
  let page = 1
  const limit = 1000 // Adjust based on your needs and API limits

  while (true) {
    try {
      // @ts-ignore
      const response = await api.client.request(
        readItems(collection, {
          fields: [primaryKeyField],
          limit,
          page,
        }),
      )

      if (response.length === 0) break

      for (const item of response) existingKeys.add(item[primaryKeyField])

      if (response.length < limit) break
      page++
    } catch (error) {
      catchError(error, {context: {collection, page}})
      break
    }
  }

  return existingKeys
}

async function uploadBatch(collection: string, batch: any[], method: Function) {
  try {
    await api.client.request(method(collection, batch))
  } catch (error) {
    catchError(error, {context: {batchSize: batch.length, collection}})
  }
}

async function loadFullData(dir: string, plan?: TemplatePlan) {
  ux.action.status = 'Updating records with full data'
  const userCollections = getUserCollections(dir, plan).filter((item) => !item.meta.singleton)

  await Promise.all(
    userCollections.map(async (collection) => {
      const name = collection.collection
      const sourceDir = path.resolve(dir, 'content')
      const data = readFile(name, sourceDir)

      const batches = chunkArray(data, BATCH_SIZE).map((batch) =>
        batch.map(({user_created, user_updated, ...cleanedRow}) => cleanedRow),
      )

      await Promise.all(batches.map((batch) => uploadBatch(name, batch, updateItemsBatch)))
    }),
  )

  ux.action.status = 'Updated records with full data'
}

async function loadSingletons(dir: string, plan?: TemplatePlan) {
  ux.action.status = 'Loading data for singleton collections'
  const singletonCollections = getUserCollections(dir, plan).filter((item) => item.meta.singleton)

  await Promise.all(
    singletonCollections.map(async (collection) => {
      const name = collection.collection
      const sourceDir = path.resolve(dir, 'content')
      const data = readFile(name, sourceDir)
      try {
        const {user_created, user_updated, ...cleanedData} = data as any

        await api.client.request(updateSingleton(name, cleanedData))
      } catch (error) {
        catchError(error, {context: {collection: name}})
      }
    }),
  )

  ux.action.status = 'Loaded data for singleton collections'
}

async function getCollectionPrimaryKeys(dir: string) {
  const fields = readFile('fields', dir)
  const primaryKeys = {}
  for (const field of fields) {
    if (field.schema && field.schema?.is_primary_key) {
      primaryKeys[field.collection] = field.field
    }
  }

  return primaryKeys
}

function getPrimaryKey(collectionsMap: any, collection: string) {
  if (!collectionsMap[collection]) {
    catchError(`Collection ${collection} not found in collections map`)
  }

  return collectionsMap[collection]
}
