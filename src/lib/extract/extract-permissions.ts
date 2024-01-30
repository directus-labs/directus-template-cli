import {readPermissions} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import writeToFile from '../utils/write-to-file'

export default async function extractPermissions(dir: string) {
  try {
    const response = await api.client.request(readPermissions({
      limit: -1,
    }))

    // Delete the id field from the permissions so we don't have to reset the autoincrement on the db
    for (const permission of response) {
      delete permission.id
    }

    await writeToFile('permissions', response, dir)
    ux.log('Extracted permissions')
  } catch (error) {
    ux.warn('Error extracting permissions:')
    ux.warn(error.message)
  }
}
