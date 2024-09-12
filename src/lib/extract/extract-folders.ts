import {readFolders} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import filterFields from '../utils/filter-fields'
import {directusFolderFields} from '../utils/system-fields'
import writeToFile from '../utils/write-to-file'

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
    catchError(error)
  }

  ux.action.stop()
}
