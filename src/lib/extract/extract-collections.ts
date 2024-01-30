import {readCollections} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import writeToFile from '../utils/write-to-file'

/**
 * Extract collections from the Directus instance
 */

export default async function extractCollections(dir: string) {
  try {
    const response = await api.client.request(readCollections())

    // Filter out system collections
    const collections = response.filter(
      collection => !collection.collection.startsWith('directus_'),
    )

    await writeToFile('collections', collections, dir)
    ux.log('Extracted collections')
  } catch (error) {
    ux.warn('Error extracting Collections:')
    ux.warn(error.message)
  }
}
