import {createPolicy, readPolicies} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import readFile from '../utils/read-file.js'
export default async function loadPolicies(dir: string) {
  const policies = readFile('policies', dir)
  ux.action.start(ux.colorize(DIRECTUS_PINK, `Loading ${policies.length} policies`))

  if (policies && policies.length > 0) {
  // Fetch existing policies
    const existingPolicies = await api.client.request(readPolicies({
      limit: -1,
    }))
    const existingPolicyIds = new Set(existingPolicies.map(policy => policy.id))

    const PUBLIC_POLICY_ID = 'abf8a154-5b1c-4a46-ac9c-7300570f4f17'
    const policiesWithoutPublic = policies.filter(policy => policy.id !== PUBLIC_POLICY_ID)

    for await (const policy of policiesWithoutPublic) {
      try {
        if (existingPolicyIds.has(policy.id)) {
          ux.action.status = `Skipping existing policy: ${policy.name}`
          continue
        }

        // Create new policy
        await api.client.request(createPolicy(policy))

        // Add the new policy ID to our set of existing policies
        existingPolicyIds.add(policy.id)
      } catch (error) {
        catchError(error)
      }
    }
  }

  ux.action.stop()
}
