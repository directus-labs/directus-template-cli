import {readFields, readRelations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import writeToFile from '../utils/write-to-file'

/**
 * Extract relations from the Directus instance
 */

export default async function extractRelations(dir: string) {
  try {
    const response = await api.client.request(readRelations())

    // Fetching fields to filter out system fields while retaining custom fields on system collections
    const fields = await api.client.request(readFields())

    const customFields = fields.filter(
      (i: any) => !i.meta?.system,
    )

    const relations = response

    // Filter out relations where the collection starts with 'directus_' && the field is not within the customFields array
    .filter(
      (i: any) =>
        !i.collection.startsWith('directus_', 0)
            || customFields.some(
              (f: { collection: string; field: string }) =>
                f.collection === i.collection && f.field === i.field,
            ),

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
