import {ux} from '@oclif/core'

import checkTemplate from '../utils/check-template.js'
import loadAccess from './load-access.js'
import loadCollections from './load-collections.js'
import loadDashboards from './load-dashboards.js'
import loadData from './load-data.js'
import loadExtensions from './load-extensions.js'
import loadFiles from './load-files.js'
import loadFlows from './load-flows.js'
import loadFolders from './load-folders.js'
import loadPermissions from './load-permissions.js'
import loadPolicies from './load-policies.js'
import loadPresets from './load-presets.js'
import loadRelations from './load-relations.js'
import loadRoles from './load-roles.js'
import loadSettings from './load-settings.js'
import loadTranslations from './load-translations.js'
import loadUsers from './load-users.js'
import updateRequiredFields from './update-required-fields.js'
import type { ApplyFlags } from './apply-flags.js'


export default async function apply(dir: string, flags: ApplyFlags) {
  const source = `${dir}/src`
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
