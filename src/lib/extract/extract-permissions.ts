import {readPermissions} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import writeToFile from '../utils/write-to-file'

/**
 * Extract Permissions from the API
 */

export default async function extractPermissions(dir: string) {
  try {
    let response = await api.client.request(readPermissions({
      limit: -1,
    }))

    // Delete the id field from the permissions so we don't have to reset the autoincrement on the db
    // Permissions API returns some items without a linked Policy, and are not stored in the DB
    response = response
    .filter(i => i.policy !== null)
    .map(i => {
      delete i.id
      return i
    })

    await writeToFile('permissions', response, dir)
    ux.log('Extracted permissions')
  } catch (error) {
    ux.warn('Error extracting permissions:')
    ux.warn(error.message)
  }
}
