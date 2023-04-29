import {api} from '../api'
import readFile from '../utils/read-file'
import loadToDestination from '../utils/load-to-destination'

export default async (dir:string) => {
  const roles = readFile('roles', dir + '/roles')
  const cleanedUpRoles = roles.map(role => {
    delete role.users
    return role
  })
  const adminRole = cleanedUpRoles.find(role => role.name == 'Administrator')

  // Admin role isn't touched.
  const customRoles = cleanedUpRoles.filter(role => role.name !== 'Administrator')
  try {
    const {data} = await api.post('roles', cleanedUpRoles)
  } catch {
    // maybe the roles already exist
  }
  // const adminUpdate = await api.patch(`roles/${adminRole.id}`, adminRole);

  // console.log('Seeded Roles');
}
