import {readFiles} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import filterFields from '../utils/filter-fields'
import {directusFileFields} from '../utils/system-fields'
import writeToFile from '../utils/write-to-file'

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
    catchError(error)
  }

  ux.action.stop()
}
