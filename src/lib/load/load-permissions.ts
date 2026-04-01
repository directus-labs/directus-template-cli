import {createPermissions, readPermissions} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import readFile from '../utils/read-file.js'

export default async function loadPermissions(
  dir: string) {
  const permissions = readFile('permissions', dir)
  ux.action.start(ux.colorize(DIRECTUS_PINK, `Loading ${permissions.length} permissions`))

  if (permissions && permissions.length > 0) {
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
      }
    } catch (error) {
      catchError(error, {
      context: {operation: 'load_permissions'},
      fatal: true,
    })
    }
  }

  ux.action.stop()
}
