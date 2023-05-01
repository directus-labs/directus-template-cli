import {api} from '../api'

export default async function loadRoles(roles: any) {
  const cleanedUpRoles = roles.map(role => {
    delete role.users
    return role
  })
  const adminRole = cleanedUpRoles.find(role => role.name === 'Administrator')

  // Admin role isn't touched.
  const customRoles = cleanedUpRoles.filter(role => role.name !== 'Administrator')
  try {
    const {data} = await api.post('roles', customRoles)
  } catch {
    // maybe the roles already exist
  }

  const adminUpdate = await api.patch(`roles/${adminRole.id}`, adminRole)
  console.log('Seeded Roles')
}
