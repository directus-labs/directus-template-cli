import {createUser} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import getRoleIds from '../utils/get-role-ids'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

export default async function loadUsers(
  dir: string,
) {
  const users = readFile('users', dir)
  ux.action.start(`Loading ${users.length} users`)

  const {legacyAdminRoleId, newAdminRoleId} = await getRoleIds(dir)

  const filteredUsers = users.map(user => {
    // If the user is an admin, we need to change their role to the new admin role
    const isAdmin = user.role === legacyAdminRoleId
    user.role = isAdmin ? newAdminRoleId : user.role

    // Delete the unneeded fields
    delete user.last_page
    delete user.token
    delete user.policies
    // Delete passwords to prevent setting to *******
    delete user.password

    return user
  })

  for await (const user of filteredUsers) {
    // If user email is null, we need to delete the email key to pass validation
    if (user.email === null) {
      delete user.email
    }

    try {
      await api.client.request(createUser(user))
    } catch (error) {
      logError(error)
    }
  }

  ux.action.stop()
  ux.log('Loaded users')
}
