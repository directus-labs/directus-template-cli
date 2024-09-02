import {createPermissions} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
// import getRoleIds from '../utils/get-role-ids'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

export default async function loadPermissions(
  dir: string) {
  const permissions = readFile('permissions', dir)
  ux.action.start(`Loading ${permissions.length} permissions`)

  // const {legacyAdminRoleId} = await getRoleIds(dir)

  const filteredPermissions = permissions
  // .filter(permission => permission.role !== legacyAdminRoleId) // Legacy. permissions are no longer related to roles
  .filter(permission => permission.policy !== null)  // public permissions have policy: null
  // Todo a way of updating public policies

  try {
    await api.client.request(createPermissions(filteredPermissions))
  } catch (error) {
    logError(error)
  }

  ux.action.stop()
  ux.log('Loaded permissions')
}
