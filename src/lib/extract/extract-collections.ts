import {readCollections} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import writeToFile from '../utils/write-to-file.js'

/**
 * Extract collections from the Directus instance
 */

export default async function extractCollections(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting collections'))
  try {
    const response = await api.client.request(readCollections())
    const collections = response.filter(
      collection => !collection.collection.startsWith('directus_'),
    )
    await writeToFile('collections', collections, dir)
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
