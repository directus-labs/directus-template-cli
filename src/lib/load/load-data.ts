import {createItems, updateItemsBatch, updateSingleton} from '@directus/sdk'
import {ux} from '@oclif/core'
import path from 'node:path'
import {api} from '../sdk'
import logError from '../utils/log-error'
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
    .filter(item => item.schema !== null) // Filter our any "folders"
    .filter(item => !item.meta.singleton) // Filter out any singletons

  for (const collection of userCollections) {
    const name = collection.collection
    const primaryKeyField = getPrimaryKey(primaryKeyMap, name)
    const sourceDir = path.resolve(dir, 'content')
    const data = readFile(name, sourceDir)

    // Batch the data
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE).map(entry => ({
        [primaryKeyField]: entry[primaryKeyField],
      }))

      try {
        await api.client.request(createItems(name, batch))
      } catch (error) {
        logError(error)
      }
    }
  }
  ux.log('Loaded skeleton records')
}

async function loadFullData(dir:string) {
  ux.log('Updating records with full data')
  const collections = readFile('collections', dir)
  const primaryKeyMap = await getCollectionPrimaryKeys(dir)
  const userCollections = collections
    .filter(item => !item.collection.startsWith('directus_', 0))
    .filter(item => item.schema !== null) // Filter our any "folders"
    .filter(item => !item.meta.singleton) // Filter out any singletons

  for (const collection of userCollections) {
    const name = collection.collection
    const primaryKeyField = getPrimaryKey(primaryKeyMap, name)
    const sourceDir = path.resolve(dir, 'content')
    const data = readFile(name, sourceDir)

    // Batch the data
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE).map(row => {
        const { user_created, user_updated, ...cleanedRow } = row
        return cleanedRow
      })

      try {
        await api.client.request(updateItemsBatch(name, batch))
      } catch (error) {
        logError(error)
      }
    }
  }
  ux.log('Updated records with full data')
}

async function loadSingletons(dir:string) {
  ux.log('Loading data for singleton collections')
  const collections = readFile('collections', dir)
  const singletonCollections = collections
    .filter(item => !item.collection.startsWith('directus_', 0))
    .filter(item => item.meta.singleton)

  for (const collection of singletonCollections) {
    const name = collection.collection
    const sourceDir = path.resolve(dir, 'content')
    const data = readFile(name, sourceDir)
    try {
      const { user_created, user_updated, ...cleanedData } = data as any
      await api.client.request(updateSingleton(name, cleanedData))
    } catch (error) {
      logError(error)
    }
  }
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
