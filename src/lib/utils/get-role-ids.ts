import type {Role} from '@directus/types'

import {readMe} from '@directus/sdk'

import {api} from '../sdk.js'
import readFile from './read-file.js'

export default async function getRoleIds(dir: string) {
  const roles = readFile('roles', dir) as Role[]

  // Legacy admin role may be undefined if the admin role was renamed in the source Directus project.
  const legacyAdminRoleId: string | undefined = roles.find(role => role.name === 'Administrator')?.id

  const currentUser = await api.client.request(readMe())

  const newAdminRoleId = currentUser.role as string

  return {email: currentUser.email, legacyAdminRoleId, newAdminRoleId}
}
