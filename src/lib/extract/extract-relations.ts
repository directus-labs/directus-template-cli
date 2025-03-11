import {readFields, readRelations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import writeToFile from '../utils/write-to-file.js'

/**
 * Extract relations from the Directus instance
 */

export default async function extractRelations(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting relations'))
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
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
