import {readPermissions} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import writeToFile from '../utils/write-to-file'

/**
 * Extract Permissions from the API
 */

export default async function extractPermissions(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting permissions'))
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
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
