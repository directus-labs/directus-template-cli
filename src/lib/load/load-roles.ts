import {createRoles, updateRole} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

export default async function loadRoles(dir: string) {
  ux.action.start('Loading roles')

  const roles = readFile('roles', dir)

  const cleanedUpRoles = roles.map(role => {
    delete role.users
    return role
  })

  const adminRole = cleanedUpRoles.find(
    role => role.name === 'Administrator',
  )

  // Admin role isn't touched.
  const customRoles = cleanedUpRoles.filter(
    role => role.name !== 'Administrator',
  )

  try {
    // Create the custom roles aside from public and admin
    await api.client.request(createRoles(customRoles))

    // Update the admin role
    await api.client.request(updateRole(adminRole.id, adminRole))
  } catch (error) {
    logError(error)
  }

  ux.action.stop()
  ux.log('Loaded roles')
}
