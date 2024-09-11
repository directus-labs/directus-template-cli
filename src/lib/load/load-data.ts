import {createItems, updateItemsBatch, updateSingleton} from '@directus/sdk'
import {ux} from '@oclif/core'
import path from 'node:path'

import {api} from '../sdk'
import catchError from '../utils/catch-error'
import {chunkArray} from '../utils/chunk-array'
import readFile from '../utils/read-file'

const BATCH_SIZE = 50

export default async function loadData(dir:string) {
  const collections = readFile('collections', dir)
  ux.action.start(`Loading data for ${collections.length} collections`)

  await loadSkeletonRecords(dir)
  await loadFullData(dir)
  await loadSingletons(dir)

  ux.action.stop()
  ux.log('Loaded data.')
}

async function loadSkeletonRecords(dir: string) {
  ux.log('Loading skeleton records')
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

    const batches = chunkArray(data, BATCH_SIZE).map(batch =>
      batch.map(entry => ({[primaryKeyField]: entry[primaryKeyField]})),
    )

    await Promise.all(batches.map(batch => uploadBatch(name, batch, createItems)))
  }))

  ux.log('Loaded skeleton records')
}

async function uploadBatch(collection: string, batch: any[], method: Function) {
  try {
    await api.client.request(method(collection, batch))
  } catch (error) {
    catchError(error)
  }
}

async function loadFullData(dir:string) {
  ux.log('Updating records with full data')
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

  ux.log('Updated records with full data')
}

async function loadSingletons(dir:string) {
  ux.log('Loading data for singleton collections')
  const collections = readFile('collections', dir)
  const singletonCollections = collections
  .filter(item => !item.collection.startsWith('directus_', 0))
  .filter(item => item.meta.singleton)

  await Promise.all(singletonCollections.map(async collection => {
    const name = collection.collection
    const sourceDir = path.resolve(dir, 'content')
    const data = readFile(name, sourceDir)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const {user_created, user_updated, ...cleanedData} = data as any
      await api.client.request(updateSingleton(name, cleanedData))
    } catch (error) {
      catchError(error)
    }
  }))

  ux.log('Loaded data for singleton collections')
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
    throw new Error(`Collection ${collection} not found in collections map`)
  }

  return collectionsMap[collection]
}
