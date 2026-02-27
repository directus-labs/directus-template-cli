import {readFolders} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import filterFields from '../utils/filter-fields.js'
import {directusFolderFields} from '../utils/system-fields.js'
import writeToFile from '../utils/write-to-file.js'

/**
 * Extract folders from the Directus instance
 */

export default async function extractFolders(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting folders'))
  try {
    const response = await api.client.request(readFolders({limit: -1}))
    const folders = filterFields(response, directusFolderFields)
    await writeToFile('folders', folders, dir)
  } catch (error) {
    catchError(error, {
      context: {operation: 'extract_folders'},
      fatal: true,
    })
  }

  ux.action.stop()
}
