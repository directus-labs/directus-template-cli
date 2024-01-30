import {createCollection, updateCollection} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

/**
 * Load collections into the Directus instance
 */

export default async function loadCollections(dir: string) {
  ux.action.start('Loading collections and fields')
  const collections = readFile('collections', dir)

  // Remove the group so that we can create the collections
  const removedGroupKey = structuredClone(collections).map(col => {
    delete col.meta.group
    return col
  })

  await addCollections(removedGroupKey, dir)
  await updateCollections(collections)

  ux.action.stop()
  ux.log('Loaded collections and fields.')
}

async function addCollections(collections: any[], dir: string) {
  const fields = readFile('fields', dir)

  for await (const collection of collections) {
    try {
      collection.fields = fields.filter(
        (field: any) => field.collection === collection.collection,
      )
      await api.client.request(createCollection(collection))
    } catch (error) {
      logError(error)
    }
  }
}

async function updateCollections(collections: any[]) {
  for await (const collection of collections) {
    try {
      if (collection.meta.group) {
        const pl = {
          meta: {
            group: collection.meta.group,
          },
        }
        await api.client.request(updateCollection(collection.collection, pl))
      }
    } catch (error) {
      logError(error)
    }
  }
}
