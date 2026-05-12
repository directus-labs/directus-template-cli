import {ux} from '@oclif/core'
import fs from 'node:fs'

import {buildTemplatePlan, type TemplatePlan, writeTemplateMetadata} from '../template-plan/index.js'
import extractAccess from './extract-access.js'
import {downloadAllFiles} from './extract-assets.js'
import extractCollections from './extract-collections.js'
import {extractContent} from './extract-content.js'
import {extractDashboards, extractPanels} from './extract-dashboards.js'
import extractExtensions from './extract-extensions.js'
import extractFields from './extract-fields.js'
import extractFiles from './extract-files.js'
import {extractFlows, extractOperations} from './extract-flows.js'
import extractFolders from './extract-folders.js'
import extractPermissions from './extract-permissions.js'
import extractPolicies from './extract-policies.js'
import extractPresets from './extract-presets.js'
import extractRelations from './extract-relations.js'
import extractRoles from './extract-roles.js'
import extractSchema from './extract-schema.js'
import extractSettings from './extract-settings.js'
import extractTranslations from './extract-translations.js'
import extractUsers from './extract-users.js'

export default async function extract(dir: string, plan: TemplatePlan = buildTemplatePlan()) {
  const destination = `${dir}/src`

  if (!fs.existsSync(destination)) {
    ux.stdout(`Attempting to create directory at: ${destination}`)
    fs.mkdirSync(destination, {recursive: true})
  }

  if (plan.components.schema) {
    await extractSchema(destination)
    await extractCollections(destination, plan)
    await extractFields(destination, plan)
    await extractRelations(destination, plan)
  }

  if (plan.components.files) {
    await extractFolders(destination)
    await extractFiles(destination)
    await downloadAllFiles(destination)
  }

  if (plan.components.users || plan.components.permissions) {
    await extractRoles(destination)
    await extractPermissions(destination)
    await extractPolicies(destination)

    if (plan.components.users) {
      await extractUsers(destination)
    }

    await extractAccess(destination)
  }

  if (plan.components.settings) {
    await extractPresets(destination)
    await extractTranslations(destination)
    await extractSettings(destination)
  }

  if (plan.components.flows) {
    await extractFlows(destination)
    await extractOperations(destination)
  }

  if (plan.components.dashboards) {
    await extractDashboards(destination)
    await extractPanels(destination)
  }

  if (plan.components.extensions) {
    await extractExtensions(destination)
  }

  if (plan.components.content) {
    await extractContent(destination, plan)
  }

  await writeTemplateMetadata(destination, plan)

  return {}
}
