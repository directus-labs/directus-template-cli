import {ux} from '@oclif/core'
import fs from 'node:fs'

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
import type {ExtractOptions} from './extract-flags.js'

export default async function extract(dir: string, flags: ExtractOptions) {
  // Get the destination directory for the actual files
  const destination = `${dir}/src`

  // Check if directory exists, if not, then create it.
  if (!fs.existsSync(destination)) {
    ux.stdout(`Attempting to create directory at: ${destination}`)
    fs.mkdirSync(destination, {recursive: true})
  }

  if (flags.schema) {
    await extractSchema(destination)
    await extractCollections(destination)
    await extractFields(destination)
    await extractRelations(destination)
  }

  if (flags.files) {
    await extractFolders(destination)
    await extractFiles(destination)
  }

  if (flags.permissions || flags.users) {
    await extractRoles(destination)
    await extractPermissions(destination)
    await extractPolicies(destination)
    await extractAccess(destination)

    if (flags.users) {
      await extractUsers(destination)
    }
  }

  if (flags.settings) {
    await extractPresets(destination)
    await extractTranslations(destination)
    await extractSettings(destination)
  }

  if (flags.flows) {
    await extractFlows(destination)
    await extractOperations(destination)
  }

  if (flags.dashboards) {
    await extractDashboards(destination)
    await extractPanels(destination)
  }

  if (flags.extensions) {
    await extractExtensions(destination)
  }

  if (flags.content) {
    await extractContent(destination)
  }

  if (flags.files) {
    await downloadAllFiles(destination)
  }

  return {}
}
