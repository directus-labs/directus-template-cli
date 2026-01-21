import {createUser, readUsers} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import getRoleIds from '../utils/get-role-ids.js'
import readFile from '../utils/read-file.js'

export default async function loadUsers(
  dir: string,
) {
  const users = readFile('users', dir)
  ux.action.start(ux.colorize(DIRECTUS_PINK, `Loading ${users.length} users`))

  if (users && users.length > 0) {
    const {legacyAdminRoleId, newAdminRoleId} = await getRoleIds(dir)
    const existingUsers = await api.client.request(readUsers({
      limit: -1,
    }))

    const filteredUsers = users.map(user => {
    // If the user is an admin, we need to change their role to the new admin role
      const isAdmin = user.role === legacyAdminRoleId
      user.role = isAdmin ? newAdminRoleId : user.role

      // Delete the unneeded fields
      user.last_page = undefined
      user.token = undefined
      user.policies = undefined
      // Delete passwords to prevent setting to *******
      user.password = undefined

      return user
    })

    for await (const user of filteredUsers) {
      const existingUserWithSameId = existingUsers && Array.isArray(existingUsers)
        ? existingUsers.find(existing => existing.id === user.id)
        : undefined

      const existingUserWithSameEmail = existingUsers && Array.isArray(existingUsers)
        ? existingUsers.find(existing => existing.email === user.email)
        : undefined

      if (existingUserWithSameId) {
        // Skip if there's an existing user with the same id
        continue
      }

      if (existingUserWithSameEmail) {
        // Delete email if there's an existing user with the same email but different id
        user.email = undefined
      }

      if (user.email === null) {
        // Delete email if it's null
        user.email = undefined
      }

      try {
        await api.client.request(createUser(user))
      } catch (error) {
        catchError(error, {
      context: {operation: 'load_users'},
      fatal: true,
    })
      }
    }
  }

  ux.action.stop()
}
