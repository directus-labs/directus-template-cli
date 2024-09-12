import {readUsers} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import filterFields from '../utils/filter-fields'
import {directusUserFields} from '../utils/system-fields'
import writeToFile from '../utils/write-to-file'

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
    catchError(error)
  }

  ux.action.stop()
}
