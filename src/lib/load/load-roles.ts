import {createRoles, updateRole} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import getRoleIds from '../utils/get-role-ids'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

export default async function loadRoles(dir: string) {
  const roles = readFile('roles', dir)
  ux.action.start(`Loading ${roles.length} roles`)

  const cleanedUpRoles = roles.map(role => {
    const r = {...role}
    delete r.users // Alias field. User roles will be applied when the users are loaded.
    delete r.parent // We need to load all roles first
    return r
  })
  // Don't load legacy admin role.
  .filter(role => role.name !== 'Administrator')

  const {legacyAdminRoleId, newAdminRoleId} = await getRoleIds(dir)

  // Just load another admin role, because other roles may have a parent of admin
  // Admin role isn't touched.
  // const customRoles = cleanedUpRoles.filter(
  //   role => role.name !== 'Administrator',
  // )

  try {
    // Create the custom roles aside from public and admin
    await api.client.request(createRoles(cleanedUpRoles))

    // Update the admin role. Do we need to do this?
    // await api.client.request(updateRole(newAdminRoleId.id, adminRoleFromSource))
  } catch (error) {
    logError(error)
  }

  // Now add in any parent fields
  const rolesWithParents = roles.filter(role => role.parent !== null)

  for await (const role of rolesWithParents) {
    try {
      // Remap any roles where the parent ID is the default admin role
      if (role.parent === legacyAdminRoleId) {
        role.parent = newAdminRoleId
      }

      const simplifiedRole = {parent: role.parent}
      await api.client.request(updateRole(role.id, simplifiedRole))
    } catch (error) {
      logError(error)
    }
  }

  ux.action.stop()
  ux.log('Loaded roles')
}

