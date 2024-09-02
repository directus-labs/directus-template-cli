import {readPolicies} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import writeToFile from '../utils/write-to-file'

export default async function extractPolicies(dir: string) {
  try {
    const response = await api.client.request(readPolicies({limit: -1}))

    // Delete the id field from the permissions so we don't have to reset the autoincrement on the db
    for (const policies of response) {
      delete policies.users // Alias Field
      delete policies.roles // Alias Field
      delete policies.permissions // Alias Field
    }

    await writeToFile('policies', response, dir)
    ux.log('Extracted policies')
  } catch (error) {
    ux.warn('Error extracting policies:')
    ux.warn(error.message)
  }
}
