import {createPermission} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

export default async function loadPermissions(
  dir: string) {
  const permissions = readFile('permissions', dir)
  ux.action.start('Loading permissions')

  for (const permission of permissions) {
    try {
      await api.client.request(createPermission(permission))
    } catch (error) {
      logError(error)
    }
  }

  ux.action.stop()
  ux.log('Loaded permissions')
}
