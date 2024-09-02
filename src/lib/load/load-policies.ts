import {createPolicies} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

export default async function loadPolicies(
  dir: string) {
  const policies = readFile('policies', dir)
  ux.action.start(`Loading ${policies.length} policies`)

  // const rolePolicies = policies.filter(i => i.policy != null)
  // const publicPolicies = policies.filter(i => i.policy === null)
  const PUBLIC_POLICY_ID = 'abf8a154-5b1c-4a46-ac9c-7300570f4f17'

  const policiesWithoutPublic = policies.filter(policy => policy.id !== PUBLIC_POLICY_ID)

  try {
    await api.client.request(createPolicies(policiesWithoutPublic))
  } catch (error) {
    logError(error)
  }

  ux.action.stop()
  ux.log('Loaded policies')
}
