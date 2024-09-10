import {createUser, readUsers} from '@directus/sdk'
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

  const incomingUserEmails = users.map(user => user.email)

  const existingUsers = await api.client.request(readUsers({
    filter: {
      email: {
        _in: incomingUserEmails,
      },
    },
  }))

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
    // If user email is null or already in use, we just delete the email key to pass validation and retain the user and any realationship data
    if (user.email === null || existingUsers.some(existingUser => existingUser.email === user.email)) {
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
