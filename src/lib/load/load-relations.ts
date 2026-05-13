import {createRelation, readRelations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import {includesRelation, type TemplatePlan} from '../template-plan/index.js'
import catchError from '../utils/catch-error.js'
import readFile from '../utils/read-file.js'

/**
 * Load relationships into the Directus instance
 * @param dir - The directory to read the relations from
 * @returns {Promise<void>} - Returns nothing
 */
export default async function loadRelations(dir: string, plan?: TemplatePlan) {
  const relations = readFile('relations', dir).filter((relation) =>
    includesRelation(relation.collection, relation.related_collection, plan),
  )
  ux.action.start(ux.colorize(DIRECTUS_PINK, `Loading ${relations.length} relations`))

  if (relations && relations.length > 0) {
    // Fetch existing relations
    const existingRelations = await api.client.request(readRelations())
    const existingRelationKeys = new Set(
      existingRelations.map((relation) => `${relation.collection}:${relation.field}:${relation.related_collection}`),
    )

    const relationsToAdd = relations
      .filter((relation) => {
        const key = `${relation.collection}:${relation.field}:${relation.related_collection}`
        if (existingRelationKeys.has(key)) {
          return false
        }

        return true
      })
      .map((relation) => {
        const cleanRelation = {...relation}
        cleanRelation.meta.id = undefined
        return cleanRelation
      })

    await addRelations(relationsToAdd)
  }

  ux.action.stop()
}

type TemplateRelation = Parameters<typeof createRelation>[0]

async function addRelations(relations: TemplateRelation[]) {
  for (const relation of relations) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await api.client.request(createRelation(relation))
    } catch (error) {
      catchError(error)
    }
  }
}
