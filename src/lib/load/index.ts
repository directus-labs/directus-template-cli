import {ux} from '@oclif/core'

import checkTemplate from '../utils/check-template'
import loadAccess from './load-access'
import loadCollections from './load-collections'
import loadDashboards from './load-dashboards'
import loadData from './load-data'
import loadExtensions from './load-extensions'
import loadFiles from './load-files'
import loadFlows from './load-flows'
import loadFolders from './load-folders'
import loadPermissions from './load-permissions'
import loadPolicies from './load-policies'
import loadPresets from './load-presets'
import loadRelations from './load-relations'
import loadRoles from './load-roles'
import loadSettings from './load-settings'
import loadTranslations from './load-translations'
import loadUsers from './load-users'
import updateRequiredFields from './update-required-fields'

interface ApplyFlags {
  content: boolean;
  dashboards: boolean;
  extensions: boolean;
  files: boolean;
  flows: boolean;
  permissions: boolean;
  schema: boolean;
  settings: boolean;
  users: boolean;
}

export default async function apply(dir: string, flags: ApplyFlags) {
  const source = dir + '/src'
  const isTemplateOk = await checkTemplate(source)
  if (!isTemplateOk) {
    ux.error('The template is missing the collections, fields, or relations files. Older templates are not supported in v0.4 of directus-template-cli. Try using v0.3 to load older templates npx directus-template-cli@0.3 apply or extract the template using latest version before applying. Exiting...')
  }

  if (flags.schema) {
    await loadCollections(source)
    await loadRelations(source)
  }

  if (flags.permissions || flags.users) {
    await loadRoles(source)
    await loadPolicies(source)
    await loadPermissions(source)

    if (flags.users) {
      await loadUsers(source)
    }

    await loadAccess(source)
  }

  if (flags.files) {
    await loadFolders(source)
    await loadFiles(source)
  }

  if (flags.content) {
    await loadData(source)
  }

  if (flags.schema) {
    await updateRequiredFields(source)
  }

  if (flags.dashboards) {
    await loadDashboards(source)
  }

  if (flags.flows) {
    await loadFlows(source)
  }

  if (flags.settings) {
    await loadSettings(source)
    await loadTranslations(source)
    await loadPresets(source)
  }

  if (flags.extensions) {
    await loadExtensions(source)
  }

  return {}
}
