import { readCollections, readItems } from '@directus/sdk'
import { ux } from '@oclif/core'

import { DIRECTUS_PINK, DIRECTUS_PURPLE } from '../constants.js'
import { api } from '../sdk.js'
import catchError from '../utils/catch-error.js'
import writeToFile from '../utils/write-to-file.js'
import { ExtractFlags } from '../../commands/extract.js'

async function getCollections(limitedCollections?: string) {
  const response = await api.client.request(readCollections())
  return response
    .filter((item) => !item.collection.startsWith('directus_', 0))
    .filter((item) => item.schema != null)
    .map((i) => i.collection)
    .filter((collection) => {
      if (!limitedCollections) return true
      return limitedCollections
        .split(',')
        .map((c) => c.trim())
        .includes(collection)
    })
}

async function getDataFromCollection(collection: string, dir: string, flags: ExtractFlags) {
  try {
    if (flags.syncExtractContent)
      ux.action.start(
        ux.colorize(DIRECTUS_PURPLE, `-- Fetching data from collection: ${collection}`)
      )
    const response = await api.client.request(readItems(collection as never, { limit: -1 }))
    await writeToFile(`${collection}`, response, `${dir}/content/`)
    if (flags.syncExtractContent) ux.action.stop('...done')
  } catch (error) {
    catchError(error)
  }
}

export async function extractContent(dir: string, flags: ExtractFlags) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting content'))
  try {
    const collections = await getCollections(flags.limitContentCollections)
    if (flags.syncExtractContent) {
      ux.stdout(ux.colorize(DIRECTUS_PURPLE, `- Limited to collections: ${collections.join(', ')}`))
      // Fetch collections one by one to reduce load on the Directus instance
      for (let i = 0; i < collections.length; i++) {
        const collection = collections[i]
        await getDataFromCollection(collection, dir, flags)
      }
    } else {
      await Promise.all(
        collections.map((collection) => getDataFromCollection(collection, dir, flags))
      )
    }
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
