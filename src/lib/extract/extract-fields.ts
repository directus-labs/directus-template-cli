import {readFields} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import writeToFile from '../utils/write-to-file.js'

/**
 * Extract fields from the Directus instance
 */

export default async function extractFields(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting fields'))
  try {
    const response = await api.client.request(readFields())

    if (!Array.isArray(response)) {
      throw new TypeError('Unexpected response format')
    }

    const fields = response
    .filter(
      // @ts-ignore
      (i: { collection: string; meta?: { system?: boolean } }) => i.meta && !i.meta.system,
    )
    .map(i => {
      if (i.meta) {
        delete i.meta.id
      }

      return i
    })

    await writeToFile('fields', fields, dir)
  } catch (error) {
    catchError(error, {
      context: {operation: 'extract_fields'},
      fatal: true,
    })
  }

  ux.action.stop()
}
