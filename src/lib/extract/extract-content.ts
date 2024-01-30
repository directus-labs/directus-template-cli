import {readCollections, readItems} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import writeToFile from '../utils/write-to-file'

export async function getCollections() {
  const response = await api.client.request(readCollections())

  const collections = response
  .filter(item => !item.collection.startsWith('directus_', 0))
  .filter(item => item.schema != null)
  .map(i => i.collection)
  return collections
}

export async function getDataFromCollection(collection: string, dir: string) {
  try {
    // @ts-ignore
    const response = await api.client.request(readItems(collection,
      {
        limit: -1,
      },
    ),
    )
    writeToFile(`${collection}`, response, `${dir}/content/`)
    ux.log('Extracted items from collection: ' + collection)
  } catch (error) {
    ux.warn(`Error extracting items from: ${collection}`)
    ux.warn(error.message)
  }
}

export async function extractContent(dir: string) {
  const collections = await getCollections()

  await Promise.all(collections.map(collection => getDataFromCollection(collection, dir)))
}
