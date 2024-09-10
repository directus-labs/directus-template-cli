import {readExtensions} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import writeToFile from '../utils/write-to-file'

/**
 * Extract extensions from the API
 */

export default async function extractExtensions(dir: string) {
  try {
    const response = await api.client.request(readExtensions())

    await writeToFile('extensions', response, dir)
    ux.log('Extracted extensions')
  } catch (error) {
    ux.warn('Error extracting extensions:')
    ux.warn(error.message)
  }
}
