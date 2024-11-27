import {readRoles} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import filterFields from '../utils/filter-fields'
import {directusRoleFields} from '../utils/system-fields'
import writeToFile from '../utils/write-to-file'

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
