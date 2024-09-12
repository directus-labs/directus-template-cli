import {createItems, readItems, updateItemsBatch, updateSingleton} from '@directus/sdk'
import {ux} from '@oclif/core'
import path from 'node:path'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import {chunkArray} from '../utils/chunk-array'
import readFile from '../utils/read-file'

const BATCH_SIZE = 50

export default async function loadData(dir:string) {
  const collections = readFile('collections', dir)
  ux.action.start(ux.colorize(DIRECTUS_PINK, `Loading data for ${collections.length} collections`))

  await loadSkeletonRecords(dir)
  await loadFullData(dir)
  await loadSingletons(dir)

  ux.action.stop()
}

async function loadSkeletonRecords(dir: string) {
  ux.action.status = 'Loading skeleton records'
  const collections = readFile('collections', dir)
  const primaryKeyMap = await getCollectionPrimaryKeys(dir)
  const userCollections = collections
  .filter(item => !item.collection.startsWith('directus_', 0))
  .filter(item => item.schema !== null)
  .filter(item => !item.meta.singleton)

  await Promise.all(userCollections.map(async collection => {
    const name = collection.collection
    const primaryKeyField = getPrimaryKey(primaryKeyMap, name)
    const sourceDir = path.resolve(dir, 'content')
    const data = readFile(name, sourceDir)

    // Fetch existing primary keys
    const existingPrimaryKeys = await getExistingPrimaryKeys(name, primaryKeyField)

    // Filter out existing records
    const newData = data.filter(entry => !existingPrimaryKeys.has(entry[primaryKeyField]))

    if (newData.length === 0) {
      // ux.log(`${ux.colorize('dim', '--')} Skipping ${name}: No new records to add`)
      return
    }

    const batches = chunkArray(newData, BATCH_SIZE).map(batch =>
      batch.map(entry => ({[primaryKeyField]: entry[primaryKeyField]})),
    )

    await Promise.all(batches.map(batch => uploadBatch(name, batch, createItems)))
    // ux.log(`${ux.colorize('dim', '--')} Added ${newData.length} new skeleton records to ${name}`)
  }))

  ux.action.status = 'Loaded skeleton records'
}

async function getExistingPrimaryKeys(collection: string, primaryKeyField: string): Promise<Set<any>> {
  const existingKeys = new Set()
  let page = 1
  const limit = 1000 // Adjust based on your needs and API limits

  while (true) {
    try {
      // @ts-expect-error string
      const response = await api.client.request(readItems(collection, {
        fields: [primaryKeyField],
        limit,
        page,
      }))

      if (response.length === 0) break

      for (const item of response) existingKeys.add(item[primaryKeyField])

      if (response.length < limit) break
      page++
    } catch (error) {
      catchError(error)
      break
    }
  }

  return existingKeys
}

async function uploadBatch(collection: string, batch: any[], method: Function) {
  try {
    await api.client.request(method(collection, batch))
  } catch (error) {
    catchError(error)
  }
}

async function loadFullData(dir:string) {
  ux.action.status = 'Updating records with full data'
  const collections = readFile('collections', dir)
  const userCollections = collections
  .filter(item => !item.collection.startsWith('directus_', 0))
  .filter(item => item.schema !== null)
  .filter(item => !item.meta.singleton)

  await Promise.all(userCollections.map(async collection => {
    const name = collection.collection
    const sourceDir = path.resolve(dir, 'content')
    const data = readFile(name, sourceDir)

    const batches = chunkArray(data, BATCH_SIZE).map(batch =>
      batch.map(({user_created, user_updated, ...cleanedRow}) => cleanedRow),
    )

    await Promise.all(batches.map(batch => uploadBatch(name, batch, updateItemsBatch)))
  }))

  ux.action.status = 'Updated records with full data'
}

async function loadSingletons(dir:string) {
  ux.action.status = 'Loading data for singleton collections'
  const collections = readFile('collections', dir)
  const singletonCollections = collections
  .filter(item => !item.collection.startsWith('directus_', 0))
  .filter(item => item.meta.singleton)

  await Promise.all(singletonCollections.map(async collection => {
    const name = collection.collection
    const sourceDir = path.resolve(dir, 'content')
    const data = readFile(name, sourceDir)
    try {
      const {user_created, user_updated, ...cleanedData} = data as any
      // @ts-expect-error
      await api.client.request(updateSingleton(name, cleanedData))
    } catch (error) {
      catchError(error)
    }
  }))

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
