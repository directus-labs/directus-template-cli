import {ux} from '@oclif/core'
import fs from 'node:fs'

import {downloadAllFiles} from './extract-assets'
import extractCollections from './extract-collections'
import {extractContent} from './extract-content'
import {extractDashboards, extractPanels} from './extract-dashboards'
import extractFields from './extract-fields'
import extractFiles from './extract-files'
import {extractFlows, extractOperations} from './extract-flows'
import extractFolders from './extract-folders'
import extractPermissions from './extract-permissions'
import extractPresets from './extract-presets'
import extractRelations from './extract-relations'
import extractRoles from './extract-roles'
import extractSchema from './extract-schema'
import extractSettings from './extract-settings'
import extractTranslations from './extract-translations'
import extractUsers from './extract-users'

export default async function extract(dir: string) {
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

  await extractFolders(destination)
  await extractFiles(destination)

  await extractUsers(destination)
  await extractRoles(destination)
  await extractPermissions(destination)

  await extractPresets(destination)

  await extractTranslations(destination)

  await extractFlows(destination)
  await extractOperations(destination)

  await extractDashboards(destination)
  await extractPanels(destination)

  await extractSettings(destination)

  await extractContent(destination)

  await downloadAllFiles(destination)

  return {}
}
