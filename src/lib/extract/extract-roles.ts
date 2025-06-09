import {readRoles} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import filterFields from '../utils/filter-fields.js'
import {directusRoleFields} from '../utils/system-fields.js'
import writeToFile from '../utils/write-to-file.js'

/**
 * Extract roles from the API
 */

export default async function extractRoles(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting roles'))
  try {
    const response = await api.client.request(readRoles({limit: -1}))
    const roles = filterFields(response, directusRoleFields)
    await writeToFile('roles', roles, dir)
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
