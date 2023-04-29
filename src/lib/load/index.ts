import readFile from '../utils/read-file'
import loadToDestination from '../utils/load-to-destination'
import loadSchema from './load-schema'
import loadRoles from './load-roles'
import loadDashboards from './load-dashboards'
import loadFiles from './load-files'
import loadUsers from './load-users'
import loadFlows from './load-flows'
import loadOperations from './load-operations'
import loadData from './load-data'
import loadSettings from './load-settings'
import loadPublicPermissions from './load-public-permissions'

export default async function apply(dir: string) {
  await loadSchema(dir + '/source/schema')
  await loadRoles(dir + '/source')
  await loadToDestination('folders', readFile('folders', dir))
  await loadDashboards()
  await loadToDestination('panels', readFile('panels')) // Comes after dashboards
  await loadFiles(dir) // Comes after folders
  await loadUsers(readFile('users')) // Comes after roles, files
  await loadFlows(readFile('flows'))
  await loadOperations() // Comes after flows
  await loadData()
  await loadToDestination('presets', readFile('presets'))
  await loadSettings(readFile('settings'))
  await loadPublicPermissions()
}
