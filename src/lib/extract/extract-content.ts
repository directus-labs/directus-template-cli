import {readCollections, readItems} from '@directus/sdk'
import {ux} from '@oclif/core'

import type {TemplatePlan} from '../template-plan/index.js'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import writeToFile from '../utils/write-to-file.js'

async function getCollections(plan?: TemplatePlan) {
  const response = await api.client.request(readCollections())
  return response
    .filter((item) => !item.collection.startsWith('directus_', 0))
    .filter((item) => item.schema != null)
    .map((i) => i.collection)
    .filter((collection) => !plan?.collections || plan.collections.includes(collection))
    .filter((collection) => !plan?.excludeCollections?.includes(collection))
}

async function getDataFromCollection(collection: string, dir: string) {
  try {
    const response = await api.client.request(readItems(collection as never, {limit: -1}))
    await writeToFile(`${collection}`, response, `${dir}/content/`)
  } catch (error) {
    catchError(error)
  }
}

export async function extractContent(dir: string, plan?: TemplatePlan) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting content'))
  try {
    const collections = await getCollections(plan)
    await Promise.all(collections.map((collection) => getDataFromCollection(collection, dir)))
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
