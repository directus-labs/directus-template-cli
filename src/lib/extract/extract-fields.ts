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
    ux.log('Extracted fields')
  } catch (error) {
    ux.warn('Error extracting Fields:')
    ux.warn(error.message)
    console.error(error)
  }
}
