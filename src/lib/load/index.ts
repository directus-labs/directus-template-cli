import {ux} from '@oclif/core'

import checkTemplate from '../utils/check-template'
import loadAccess from './load-access'
import loadCollections from './load-collections'
import loadDashboards from './load-dashboards'
import loadData from './load-data'
import loadFiles from './load-files'
import loadFlows from './load-flows'
import loadFolders from './load-folders'
import loadPermissions from './load-permissions'
import loadPolicies from './load-policies'
import loadPresets from './load-presets'
import loadRelations from './load-relations'
import loadRoles from './load-roles'
import loadExtensions from './load-extensions'
// import loadSchema from './load-schema'
import loadSettings from './load-settings'
import loadTranslations from './load-translations'
import loadUsers from './load-users'

export default async function apply(dir: string) {
  // Get the source directory for the actual files
  const source = dir + '/src'

  const isTemplateOk = await checkTemplate(source)

  if (!isTemplateOk) {
    ux.error('The template is missing the collections, fields, or relations files. Older templates are not supported in v0.4 of directus-template-cli. Try using v0.3 to load older templates npx directus-template-cli@0.3 apply or extract the template using latest version before applying. Exiting...')
  }


  await loadCollections(source)
  await loadRelations(source)

  await loadRoles(source)
  await loadPolicies(source)

  await loadFolders(source)
  await loadFiles(source)

  await loadUsers(source)

  await loadAccess(source)

  await loadDashboards(source)

  await loadData(source)

  await loadFlows(source)

  await loadPresets(source)

  await loadTranslations(source)

  await loadSettings(source)

  await loadPermissions(source)

  await loadExtensions(source)

  return {}
}
