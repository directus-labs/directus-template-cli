import {createUser, readUsers} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import getRoleIds from '../utils/get-role-ids'
import readFile from '../utils/read-file'

export default async function loadUsers(
  dir: string,
) {
  const users = readFile('users', dir)
  ux.action.start(ux.colorize(DIRECTUS_PINK, `Loading ${users.length} users`))

  if (users && users.length > 0) {
    const {legacyAdminRoleId, newAdminRoleId} = await getRoleIds(dir)

    const incomingUserEmails = users.map(user => user.email)
    const incomingUserIds = users.map(user => user.id).filter(Boolean)

    const existingUsers = await api.client.request(readUsers({
      filter: {
        _or: [
          {email: {_in: incomingUserEmails}},
          {id: {_in: incomingUserIds}},
        ],
      },
      limit: -1,
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
        delete user.email
      }

      if (user.email === null) {
        // Delete email if it's null
        delete user.email
      }

      try {
        await api.client.request(createUser(user))
      } catch (error) {
        catchError(error)
      }
    }
  }

  ux.action.stop()
}
