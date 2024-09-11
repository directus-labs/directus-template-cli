import {createPolicy, readPolicies} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

export default async function loadPolicies(dir: string) {
  const policies = readFile('policies', dir)
  ux.action.start(`Loading ${policies.length} policies`)

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
        ux.log(`Skipping existing policy: ${policy.name}`)
        continue
      }

      // Create new policy
      await api.client.request(createPolicy(policy))
      ux.log(`Created new policy: ${policy.name}`)

      // Add the new policy ID to our set of existing policies
      existingPolicyIds.add(policy.id)
    } catch (error) {
      catchError(error)
    }
  }

  ux.action.stop()
  ux.log('Loaded policies')
}
