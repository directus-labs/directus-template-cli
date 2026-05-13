import {updateCollection} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import {includesSchemaCollection, type TemplatePlan} from '../template-plan/index.js'
import catchError from '../utils/catch-error.js'
import readFile from '../utils/read-file.js'

interface TemplateCollection {
  collection: string
  meta?: {
    [key: string]: unknown
    group?: null | string
  }
}

export default async function finalizeCollections(dir: string, plan?: TemplatePlan) {
  const collections = (readFile('collections', dir) as TemplateCollection[])
    .filter((collection) => includesSchemaCollection(collection.collection, plan))
    .filter((collection) => !collection.collection.startsWith('directus_'))

  ux.action.start(ux.colorize(DIRECTUS_PINK, `Finalizing metadata for ${collections.length} collections`))

  const collectionNames = new Set(collections.map((collection) => collection.collection))

  for await (const collection of collections) {
    const meta = {...collection.meta}
    if (meta.group && !collectionNames.has(meta.group)) {
      ux.warn(`Skipping missing group "${meta.group}" for collection "${collection.collection}"`)
      delete meta.group
    }

    try {
      await api.client.request(updateCollection(collection.collection, {meta}))
    } catch (error) {
      catchError(error, {context: {collection: collection.collection, group: meta.group}})
    }
  }

  ux.action.stop()
}
