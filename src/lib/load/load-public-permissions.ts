import {loadToDestination, readFile} from '.'
import {session} from './api'

export default loadPublicPermissions = async () => {
  await removeallPublicPermissions()
  const roles = readFile('publicPermissions')
  await loadToDestination('permissions', roles)
}

const removeallPublicPermissions = async () => {
  const {data} = await api.get('permissions?filter[role][_null]=true&limit=-1')
  const ids = data.data.map(i => i.id)
  if (!ids) return
  await api.delete('permissions', {
    data: ids,
  })
}
