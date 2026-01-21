import {readFiles} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import filterFields from '../utils/filter-fields.js'
import {directusFileFields} from '../utils/system-fields.js'
import writeToFile from '../utils/write-to-file.js'

/**
 * Extract files from the API
 */

export default async function extractFiles(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting files'))
  try {
    const response = await api.client.request(readFiles({limit: -1}))
    const files = filterFields(response, directusFileFields)
    await writeToFile('files', files, dir)
  } catch (error) {
    catchError(error, {
      context: {operation: 'extract_files'},
      fatal: true,
    })
  }

  ux.action.stop()
}
