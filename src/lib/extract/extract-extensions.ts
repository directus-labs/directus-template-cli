import {readExtensions} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import writeToFile from '../utils/write-to-file.js'

/**
 * Extract extensions from the API
 */

export default async function extractExtensions(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting extensions'))
  try {
    const response = await api.client.request(readExtensions())
    await writeToFile('extensions', response, dir)
  } catch (error) {
    catchError(error, {
      context: {operation: 'extract_extensions'},
      fatal: true,
    })
  }

  ux.action.stop()
}
