import {ux} from '@oclif/core'
import * as inquirer from 'inquirer'

import checkTemplate from '../utils/check-template'
import loadCollections from './load-collections'
import loadDashboards from './load-dashboards'
import loadData from './load-data'
import loadFiles from './load-files'
import loadFlows from './load-flows'
import loadFolders from './load-folders'
import loadPermissions from './load-permissions'
import loadPresets from './load-presets'
import loadRelations from './load-relations'
import loadRoles from './load-roles'
import loadSchema from './load-schema'
import loadSettings from './load-settings'
import loadTranslations from './load-translations'
import loadUsers from './load-users'

export default async function apply(dir: string) {
  // Get the source directory for the actual files
  const source = dir + '/src'

  const schemaOptions = await checkTemplate(source)

  if (!schemaOptions.collections && !schemaOptions.schema) {
    ux.error('The template is missing the schema file or the collections, fields, and relations files.')
    return
  }

  // If overwriting schema
  // await loadSchema(source + "/schema");

  // If adding schema instead of overwriting
  await loadCollections(source)
  await loadRelations(source)

  await loadRoles(source)

  await loadFolders(source)
  await loadFiles(source)

  await loadUsers(source)

  await loadDashboards(source)

  await loadData(source)

  await loadFlows(source)

  await loadPresets(source)

  await loadTranslations(source)

  await loadSettings(source)

  await loadPermissions(source)

  return {}
}
