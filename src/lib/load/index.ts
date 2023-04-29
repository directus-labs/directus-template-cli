// import path from 'node:path'
// import fs from 'node:fs'
import readFile from '../utils/read-file'
// import loadToDestination from '../utils/loadToDestination'
import loadSchema from './load-schema'
import loadRoles from './load-roles'
import loadToDestination from '../utils/load-to-destination'
// import loadUsers from './loadUsers'
// import loadSettings from './loadSettings'
// import loadData from './loadData'
// import loadPublicPermissions from './loadPublicPermissions'
// import loadFiles from './loadFiles'
// import loadFlows from './loadFlows'
// import loadOperations from './loadOperations'

export default async function apply(dir: string) {
  await loadSchema(dir + '/source/schema')
  await loadRoles(dir + '/source')
  await loadToDestination('folders', readFile('folders', dir))
  // // await loadToDestination("dashboards", readFile("dashboards"));
  // await loadDashboards()
  // await loadToDestination('panels', readFile('panels')) // Comes after dashboards
  // await loadFiles() // comes after folders
  // await loadUsers(readFile('users')) // Comes after roles, files
  // await loadFlows(readFile('flows'))
  // await loadOperations() // comes after flows
  // await loadData()
  // await loadToDestination('presets', readFile('presets'))
  // await loadSettings(readFile('settings'))
  // await loadPublicPermissions()
}
