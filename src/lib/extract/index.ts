import {ux} from '@oclif/core'
import fs from 'node:fs'

import {buildTemplatePlan, type TemplatePlan, type TemplateWarning, writeTemplateMetadata} from '../template-plan/index.js'
import catchError from '../utils/catch-error.js'
import {expandDeepPlan} from './expand-deep-plan.js'
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
  const effectivePlan = await expandDeepPlan(plan)

  if (!fs.existsSync(destination)) {
    ux.stdout(`Attempting to create directory at: ${destination}`)
    try {
      fs.mkdirSync(destination, {recursive: true})
    } catch (error) {
      catchError(error, {context: {destination}, fatal: true})
    }
  }

  if (effectivePlan.components.schema) {
    await extractSchema(destination)
    await extractCollections(destination, effectivePlan)
    await extractFields(destination, effectivePlan)
    await extractRelations(destination, effectivePlan)
  }

  if (effectivePlan.components.files) {
    await extractFolders(destination)
    await extractFiles(destination)
    await downloadAllFiles(destination)
  }

  if (effectivePlan.components.users || effectivePlan.components.permissions) {
    await extractRoles(destination)
    await extractPermissions(destination)
    await extractPolicies(destination)

    if (effectivePlan.components.users) {
      await extractUsers(destination)
    }

    await extractAccess(destination)
  }

  if (effectivePlan.components.settings) {
    await extractPresets(destination)
    await extractTranslations(destination)
    await extractSettings(destination)
  }

  if (effectivePlan.components.flows) {
    await extractFlows(destination)
    await extractOperations(destination)
  }

  if (effectivePlan.components.dashboards) {
    await extractDashboards(destination)
    await extractPanels(destination)
  }

  if (effectivePlan.components.extensions) {
    await extractExtensions(destination)
  }

  const warnings: TemplateWarning[] = []

  if (effectivePlan.components.content) {
    const contentWarnings = await extractContent(destination, effectivePlan)
    warnings.push(...contentWarnings)
  }

  for (const warning of warnings) {
    ux.warn(`Excluded relation: ${warning.collection}.${warning.field} -> ${warning.relatedCollection} (${warning.count} records)`)
  }

  try {
    await writeTemplateMetadata(destination, effectivePlan, warnings)
  } catch (error) {
    catchError(error, {
      context: {function: 'writeTemplateMetadata'},
      fatal: true,
    })
  }

  return {}
}
