import {readFolders} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import filterFields from '../utils/filter-fields'
import {directusFolderFields} from '../utils/system-fields'
import writeToFile from '../utils/write-to-file'

/**
 * Extract folders from the Directus instance
 */

export default async function extractFolders(dir: string) {
  try {
    const response = await api.client.request(readFolders(
      {limit: -1},
    ))

    const folders = filterFields(response, directusFolderFields)

    await writeToFile('folders', folders, dir)
    ux.log('Extracted folders')
  } catch (error) {
    ux.warn('Error extracting Folders:')
    ux.warn(error.message)
  }
}
