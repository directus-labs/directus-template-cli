import {readUsers} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import filterFields from '../utils/filter-fields.js'
import {directusUserFields} from '../utils/system-fields.js'
import writeToFile from '../utils/write-to-file.js'

/**
 * Extract users from the Directus instance
 */

export default async function extractUsers(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting users'))
  try {
    const response = await api.client.request(readUsers({limit: -1}))
    const users = filterFields(response, directusUserFields)
    await writeToFile('users', users, dir)
  } catch (error) {
    catchError(error, {
      context: {operation: 'extract_users'},
      fatal: true,
    })
  }

  ux.action.stop()
}
