import {createCollection, createField, updateCollection} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

/**
 * Load collections into the Directus instance
 */

export default async function loadCollections(dir: string) {
  const collections = readFile('collections', dir)
  const fields = readFile('fields', dir)
  ux.action.start(`Loading ${collections.length} collections and ${fields.length} fields.`)

  // Remove the group so that we can create the collections
  const removedGroupKey = structuredClone(collections).map(col => {
    delete col.meta.group
    return col
  })

  await addCollections(removedGroupKey, fields)
  await updateCollections(collections)
  await addCustomFieldsOnSystemCollections(fields)

  ux.action.stop()
  ux.log('Loaded collections and fields.')
}

async function addCollections(collections: any[], fields: any[]) {
  for await (const collection of collections) {
    try {
      collection.fields = fields.filter(
        (field: any) => field.collection === collection.collection,
      )
      await api.client.request(createCollection(collection))
    } catch (error) {
      catchError(error)
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
      catchError(error)
    }
  }
}

async function addCustomFieldsOnSystemCollections(fields: any[]) {
  const customFields = fields.filter(
    (field: any) => field.collection.startsWith('directus_'),
  )

  for await (const field of customFields) {
    try {
      await api.client.request(createField(field.collection, field))
    } catch (error) {
      catchError(error)
    }
  }
}
