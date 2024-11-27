import {readCollections, readItems} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import writeToFile from '../utils/write-to-file'

async function getCollections() {
  const response = await api.client.request(readCollections())
  return response
  .filter(item => !item.collection.startsWith('directus_', 0))
  .filter(item => item.schema != null)
  .map(i => i.collection)
}

async function getDataFromCollection(collection: string, dir: string) {
  try {
    const response = await api.client.request(readItems(collection as never, {limit: -1}))
    await writeToFile(`${collection}`, response, `${dir}/content/`)
  } catch (error) {
    catchError(error)
  }
}

export async function extractContent(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting content'))
  try {
    const collections = await getCollections()
    await Promise.all(collections.map(collection => getDataFromCollection(collection, dir)))
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
