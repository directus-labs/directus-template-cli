import {readRelations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import writeToFile from '../utils/write-to-file'

/**
 * Extract relations from the Directus instance
 */

export default async function extractRelations(dir: string) {
  try {
    const response = await api.client.request(readRelations())

    // @TODO: Support custom fields for system collections
    // Filter out system collections
    const relations = response
    .filter(
      (i: { collection: string }) => !i.collection.startsWith('directus_'),
    )
    .map(i => {
      delete i.meta.id
      return i
    })

    await writeToFile('relations', relations, dir)
    ux.log('Extracted relations')
  } catch (error) {
    ux.warn('Error extracting Relations:')
    ux.warn(error.message)
  }
}
