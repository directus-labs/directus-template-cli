import {createRole, readRoles, updateRole} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import catchError from '../utils/catch-error'
import getRoleIds from '../utils/get-role-ids'
import readFile from '../utils/read-file'

export default async function loadRoles(dir: string) {
  const roles = readFile('roles', dir)
  ux.action.start(`Loading ${roles.length} roles`)
  const {legacyAdminRoleId, newAdminRoleId} = await getRoleIds(dir)

  // Fetch existing roles
  const existingRoles = await api.client.request(readRoles({
    limit: -1,
  }))
  const existingRoleIds = new Set(existingRoles.map(role => role.id))
  const existingRoleNames = new Set(existingRoles.map(role => role.name.toLowerCase()))

  const cleanedUpRoles = roles
  .filter(role => role.name !== 'Administrator') // Don't load legacy admin role
  .filter(role => !existingRoleNames.has(role.name.toLowerCase())) // Filter out roles with existing names
  .map(role => {
    const r = {...role}
    delete r.users // Alias field. User roles will be applied when the users are loaded.
    delete r.parent // We need to load all roles first
    return r
  })

  for await (const role of cleanedUpRoles) {
    try {
      if (existingRoleIds.has(role.id)) {
        ux.log(`Skipping existing role: ${role.name}`)
        continue
      }

      // Create new role
      await api.client.request(createRole(role))
      // Add the new role ID and name to our sets of existing roles
      existingRoleIds.add(role.id)
      existingRoleNames.add(role.name.toLowerCase())
    } catch (error) {
      catchError(error)
    }
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
      ux.log(`Updated parent for role: ${role.name}`)
    } catch (error) {
      catchError(error)
    }
  }

  ux.action.stop()
  ux.log('Loaded roles')
}
