import {createRelation} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

/**
 * Load relationships into the Directus instance
 */

export default async function loadRelations(dir: string) {
  const relations = readFile('relations', dir)
  ux.action.start(`Loading ${relations.length} relations`)

  const relationsToAdd = relations.map(i => {
    delete i.meta.id
    return i
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
      logError(error)
    }
  }
}
