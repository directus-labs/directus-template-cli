import {createPermissions, readPermissions} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

export default async function loadPermissions(
  dir: string) {
  const permissions = readFile('permissions', dir)
  ux.action.start(`Loading ${permissions.length} permissions`)

  try {
    const existingPermissions = await api.client.request(readPermissions({
      limit: -1,
    }))

    const existingPermissionKeys = new Set(
      existingPermissions.map(p => `${p.collection}:${p.action}:${p.policy}`),
    )

    // Filter out duplicates
    const newPermissions = permissions.filter(newPerm =>
      !existingPermissionKeys.has(`${newPerm.collection}:${newPerm.action}:${newPerm.policy}`),
    )

    if (newPermissions.length > 0) {
      await api.client.request(createPermissions(newPermissions))
      ux.log(`Created ${newPermissions.length} new permissions`)
    } else {
      ux.log('No new permissions to create')
    }
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
  ux.log('Loaded permissions')
}
