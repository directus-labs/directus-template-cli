import {readFields} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import writeToFile from '../utils/write-to-file'

/**
 * Extract fields from the Directus instance
 */

export default async function extractFields(dir: string) {
  try {
    const response = await api.client.request(readFields())

    // @TODO: Support custom fields for system collections
    // Filter out system collections
    const fields = response
    .filter(
      (i: { collection: string }) => !i.collection.startsWith('directus_'),
    )
    .map(i => {
      delete i.meta.id
      return i
    })

    await writeToFile('fields', fields, dir)
    ux.log('Extracted fields')
  } catch (error) {
    ux.warn('Error extracting Fields:')
    ux.warn(error.message)
  }
}
