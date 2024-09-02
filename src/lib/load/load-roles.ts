import {createRoles, updateRole} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

export default async function loadRoles(dir: string) {
  const roles = readFile('roles', dir)
  ux.action.start(`Loading ${roles.length} roles`)

  const cleanedUpRoles = roles.map(role => {
    const r = {...role}
    delete r.users
    delete r.parent // We need to load all roles first
    return r
  })

  const adminRole = cleanedUpRoles.find(
    role => role.name === 'Administrator',
  )

  // Just laod another admin role, because other roles may have a parent of admin
  // Admin role isn't touched.
  // const customRoles = cleanedUpRoles.filter(
  //   role => role.name !== 'Administrator',
  // )

  try {
    // Create the custom roles aside from public and admin
    await api.client.request(createRoles(cleanedUpRoles))

    // Update the admin role
    await api.client.request(updateRole(adminRole.id, adminRole))
  } catch (error) {
    logError(error)
  }

  // Now add in any parent fields
  const rolesWithParents = roles.filter(role => role.parent !== null)

  for await (const role of rolesWithParents) {
    try {
      const simplifiedRole = {parent: role.parent}
      await api.client.request(updateRole(role.id, simplifiedRole))
    } catch (error) {
      logError(error)
    }
  }

  ux.action.stop()
  ux.log('Loaded roles')
}
