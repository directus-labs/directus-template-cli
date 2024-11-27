import {readPolicies} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import writeToFile from '../utils/write-to-file'

/**
 * Extract policies from the API
 */

export default async function extractPolicies(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting policies'))
  try {
    const response = await api.client.request(readPolicies({limit: -1}))

    // Delete the id field from the permissions so we don't have to reset the autoincrement on the db
    for (const policies of response) {
      delete policies.users // Alias Field
      delete policies.roles // Alias Field
      delete policies.permissions // Alias Field
    }

    await writeToFile('policies', response, dir)
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
