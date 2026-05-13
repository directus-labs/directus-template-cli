import type {Collection, Field} from '@directus/types'

import {createCollection, createField, readCollections, readFields} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import {includesSchemaCollection, type TemplatePlan} from '../template-plan/index.js'
import catchError from '../utils/catch-error.js'
import readFile from '../utils/read-file.js'

/**
 * Load collections into the Directus instance
 * @param dir - The directory to read the collections and fields from
 * @returns {Promise<void>} - Returns nothing
 */
export default async function loadCollections(dir: string, plan?: TemplatePlan) {
  const collectionsToAdd = readFile('collections', dir).filter((collection) =>
    includesSchemaCollection(collection.collection, plan),
  )
  const fieldsToAdd = readFile('fields', dir).filter((field) => includesSchemaCollection(field.collection, plan))

  ux.action.start(
    ux.colorize(DIRECTUS_PINK, `Loading ${collectionsToAdd.length} collections and ${fieldsToAdd.length} fields`),
  )

  await processCollections(collectionsToAdd, fieldsToAdd)
  await addCustomFieldsOnSystemCollections(fieldsToAdd)

  ux.action.stop()
}

async function processCollections(collectionsToAdd: any[], fieldsToAdd: any[]) {
  const existingCollections = await api.client.request(readCollections())
  const existingFields = await api.client.request(readFields())

  for await (const collection of collectionsToAdd) {
    try {
      const existingCollection = existingCollections.find((c: any) => c.collection === collection.collection)

      await (existingCollection
        ? addNewFieldsToExistingCollection(collection.collection, fieldsToAdd, existingFields)
        : addNewCollectionWithFields(collection, fieldsToAdd))
    } catch (error) {
      catchError(error, {context: {collection: collection.collection}})
    }
  }
}

const removeRequiredorIsNullable = (field: Field) => {
  if (field.meta?.required === true) {
    field.meta.required = false
  }

  if (field.schema?.is_nullable === false) {
    field.schema.is_nullable = true
  }

  if (field.schema?.is_unique === true) {
    field.schema.is_unique = false
  }

  return field
}

async function addNewCollectionWithFields(collection: any, allFields: Field[]) {
  const collectionFields = allFields
    .filter((field) => field.collection === collection.collection)
    .map((field) => removeRequiredorIsNullable(field))
  const collectionWithoutGroup = {
    ...collection,
    fields: collectionFields,
    meta: {...collection.meta},
  }
  delete collectionWithoutGroup.meta.group
  await api.client.request(createCollection(collectionWithoutGroup))
}

async function addNewFieldsToExistingCollection(collectionName: string, fieldsToAdd: Field[], existingFields: any[]) {
  const collectionFieldsToAdd = fieldsToAdd
    .filter((field) => field.collection === collectionName)
    .map((field) => removeRequiredorIsNullable(field))

  const existingCollectionFields = existingFields.filter((field: any) => field.collection === collectionName)

  for await (const field of collectionFieldsToAdd) {
    if (!existingCollectionFields.some((existingField: any) => existingField.field === field.field)) {
      try {
        // @ts-ignore - ignore
        await api.client.request(createField(collectionName, field))
      } catch (error) {
        catchError(error, {context: {collection: collectionName, field: field.field}})
      }
    }
  }
}

async function addCustomFieldsOnSystemCollections(fields: any[]) {
  const customFields = fields.filter((field: any) => field.collection.startsWith('directus_'))

  const existingFields = await api.client.request(readFields())

  for await (const field of customFields) {
    try {
      const fieldExists = existingFields.some(
        (existingField: any) => existingField.collection === field.collection && existingField.field === field.field,
      )

      if (!fieldExists) {
        // @ts-ignore
        await api.client.request(createField(field.collection, field))
      }
    } catch (error) {
      catchError(error, {context: {collection: field.collection, field: field.field}})
    }
  }
}
