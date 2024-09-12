import {createCollection, createField, readCollections, readFields, updateCollection} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

/**
 * Load collections into the Directus instance
 */

export default async function loadCollections(dir: string) {
  const collectionsToAdd = readFile('collections', dir)
  const fieldsToAdd = readFile('fields', dir)

  ux.action.start(ux.colorize(DIRECTUS_PINK, `Loading ${collectionsToAdd.length} collections and ${fieldsToAdd.length} fields`))

  await processCollections(collectionsToAdd, fieldsToAdd)
  await updateCollections(collectionsToAdd)
  await addCustomFieldsOnSystemCollections(fieldsToAdd)

  ux.action.stop()
}

async function processCollections(collectionsToAdd: any[], fieldsToAdd: any[]) {
  const existingCollections = await api.client.request(readCollections())
  const existingFields = await api.client.request(readFields())

  for await (const collection of collectionsToAdd) {
    try {
      const existingCollection = existingCollections.find((c: any) => c.collection === collection.collection)

      await (existingCollection ? addNewFieldsToExistingCollection(collection.collection, fieldsToAdd, existingFields) : addNewCollectionWithFields(collection, fieldsToAdd))
    } catch (error) {
      catchError(error)
    }
  }
}

async function addNewCollectionWithFields(collection: any, allFields: any[]) {
  const collectionFields = allFields.filter(field => field.collection === collection.collection)
  const collectionWithoutGroup = {
    ...collection,
    fields: collectionFields,
    meta: {...collection.meta},
  }
  delete collectionWithoutGroup.meta.group
  await api.client.request(createCollection(collectionWithoutGroup))
}

async function addNewFieldsToExistingCollection(collectionName: string, fieldsToAdd: any[], existingFields: any[]) {
  const collectionFieldsToAdd = fieldsToAdd.filter(field => field.collection === collectionName)
  const existingCollectionFields = existingFields.filter((field: any) => field.collection === collectionName)

  for await (const field of collectionFieldsToAdd) {
    if (!existingCollectionFields.some((existingField: any) => existingField.field === field.field)) {
      try {
        // @ts-ignore
        await api.client.request(createField(collectionName, field))
      } catch (error) {
        catchError(error)
      }
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

  const existingFields = await api.client.request(readFields())

  for await (const field of customFields) {
    try {
      const fieldExists = existingFields.some((existingField: any) =>
        existingField.collection === field.collection && existingField.field === field.field,
      )

      if (!fieldExists) {
        // @ts-expect-error string
        await api.client.request(createField(field.collection, field))
      }
    } catch (error) {
      catchError(error)
    }
  }
}
