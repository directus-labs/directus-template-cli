import {ux} from '@oclif/core'
import fs from 'node:fs'

import extractAccess from './extract-access'
import {downloadAllFiles} from './extract-assets'
import extractCollections from './extract-collections'
import {extractContent} from './extract-content'
import {extractDashboards, extractPanels} from './extract-dashboards'
import extractExtensions from './extract-extensions'
import extractFields from './extract-fields'
import extractFiles from './extract-files'
import {extractFlows, extractOperations} from './extract-flows'
import extractFolders from './extract-folders'
import extractPermissions from './extract-permissions'
import extractPolicies from './extract-policies'
import extractPresets from './extract-presets'
import extractRelations from './extract-relations'
import extractRoles from './extract-roles'
import extractSchema from './extract-schema'
import extractSettings from './extract-settings'
import extractTranslations from './extract-translations'
import extractUsers from './extract-users'

interface ExtractOptions {
  excludeCollections?: string[];
  skipFiles?: boolean;
}

export default async function extract(dir: string, options: ExtractOptions = {}) {
  const { excludeCollections, skipFiles = false } = options;
  
  // Get the destination directory for the actual files
  const destination = dir + '/src'

  // Check if directory exists, if not, then create it.
  if (!fs.existsSync(destination)) {
    ux.log(`Attempting to create directory at: ${destination}`)
    fs.mkdirSync(destination, {recursive: true})
  }

  await extractSchema(destination)

  await extractCollections(destination)
  await extractFields(destination)
  await extractRelations(destination)

  // Only extract files and folders if skipFiles is false
  if (!skipFiles) {
    await extractFolders(destination)
    await extractFiles(destination)
  }

  await extractUsers(destination)
  await extractRoles(destination)
  await extractPermissions(destination)
  await extractPolicies(destination)
  await extractAccess(destination)

  await extractPresets(destination)

  await extractTranslations(destination)

  await extractFlows(destination)
  await extractOperations(destination)

  await extractDashboards(destination)
  await extractPanels(destination)

  await extractSettings(destination)
  await extractExtensions(destination)

  await extractContent(destination, excludeCollections)

  // Only download files if skipFiles is false
  if (!skipFiles) {
    await downloadAllFiles(destination)
  }

  return {}
}