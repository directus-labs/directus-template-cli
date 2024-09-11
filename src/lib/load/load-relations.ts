import {createRelation, readRelations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

/**
 * Load relationships into the Directus instance
 */

export default async function loadRelations(dir: string) {
  const relations = readFile('relations', dir)
  ux.action.start(`Loading ${relations.length} relations`)

  // Fetch existing relations
  const existingRelations = await api.client.request(readRelations())
  const existingRelationKeys = new Set(existingRelations.map(relation =>
    `${relation.collection}:${relation.field}:${relation.related_collection}`,
  ))

  const relationsToAdd = relations.filter(relation => {
    const key = `${relation.collection}:${relation.field}:${relation.related_collection}`
    if (existingRelationKeys.has(key)) {
      ux.log(`Skipping existing relation: ${key}`)
      return false
    }

    return true
  }).map(relation => {
    const cleanRelation = {...relation}
    delete cleanRelation.meta.id
    return cleanRelation
  })

  await addRelations(relationsToAdd)

  ux.action.stop()
  ux.log('Loaded relations')
}

async function addRelations(relations: any[]) {
  for await (const relation of relations) {
    try {
      await api.client.request(createRelation(relation))
    } catch (error) {
      catchError(error)
    }
  }
}
