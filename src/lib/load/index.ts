import {ux} from '@oclif/core'

import type {ApplyFlags} from './apply-flags.js'

import {applyMetadataToPlan, buildTemplatePlan, readTemplateMetadata} from '../template-plan/index.js'
import checkTemplate from '../utils/check-template.js'
import finalizeCollections from './finalize-collections.js'
import finalizeFields from './finalize-fields.js'
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

export default async function apply(dir: string, flags: ApplyFlags) {
  const source = `${dir}/src`
  const metadata = readTemplateMetadata(source)
  const requestedPlan = buildTemplatePlan(flags)
  const effectivePlan = applyMetadataToPlan(requestedPlan, metadata)
  const {components} = effectivePlan

  if (!metadata) {
    ux.warn('No template-meta.json found. Treating as a full template — relation integrity check skipped.')
  } else if (metadata.partial) {
    ux.warn('Template metadata indicates this is a partial template.')
  }

  const brokenRelationWarnings = metadata?.warnings?.filter((warning) => warning.type === 'excluded_relation') || []
  if (components.content && brokenRelationWarnings.length > 0 && !effectivePlan.allowBrokenRelations) {
    ux.error(
      'This partial template contains excluded relation references. Re-run with --allow-broken-relations to apply anyway.',
    )
  }

  if (!metadata || components.schema) {
    const isTemplateOk = await checkTemplate(source)
    if (!isTemplateOk) {
      ux.error(
        'The template is missing the collections, fields, or relations files. Older templates are not supported in v0.4 of directus-template-cli. Try using v0.3 to load older templates npx directus-template-cli@0.3 apply or extract the template using latest version before applying. Exiting...',
      )
    }
  }

  if (components.schema) {
    await loadCollections(source, effectivePlan)
    await loadRelations(source, effectivePlan)
    await finalizeCollections(source, effectivePlan)
    await finalizeFields(source, effectivePlan)
  }

  if (components.permissions || components.users) {
    await loadRoles(source)
    await loadPolicies(source)
    await loadPermissions(source)

    if (components.users) {
      await loadUsers(source)
    }

    await loadAccess(source)
  }

  if (components.files) {
    await loadFolders(source)
    await loadFiles(source)
  }

  if (components.content) {
    await loadData(source, effectivePlan)
  }

  if (components.dashboards) {
    await loadDashboards(source)
  }

  if (components.flows) {
    await loadFlows(source)
  }

  if (components.settings) {
    await loadSettings(source)
    await loadTranslations(source)
    await loadPresets(source)
  }

  if (components.extensions) {
    await loadExtensions(source)
  }

  return {}
}
