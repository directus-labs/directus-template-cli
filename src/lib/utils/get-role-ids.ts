import {readMe} from '@directus/sdk'

import {api} from '../sdk'
import readFile from './read-file'

export default async function getRoleIds(dir: string) {
  const roles = readFile('roles', dir)

  const legacyAdminRoleId = roles.find(role => role.name === 'Administrator').id

  const currentUser = await api.client.request(readMe())

  const newAdminRoleId = currentUser.role

  return {legacyAdminRoleId, newAdminRoleId}
}
