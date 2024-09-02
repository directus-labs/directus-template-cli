import {ux} from '@oclif/core'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

export default async function loadAccess(
  dir: string) {
  const access = readFile('access', dir)
  ux.action.start(`Loading ${access.length} accesses`)

  // const rolePolicies = policies.filter(i => i.policy != null)
  // const publicPolicies = policies.filter(i => i.policy === null)

  for await (const acc of access) {
    try {
      await api.client.request(() => ({
        body: JSON.stringify(acc),
        method: 'POST',
        path: '/access',
      }))
    } catch (error) {
      logError(error)
    }
  }

  ux.action.stop()
  ux.log('Loaded Accesses')
}
