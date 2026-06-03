import {Flags} from '@oclif/core'

export const componentNames = [
  'schema',
  'content',
  'files',
  'flows',
  'dashboards',
  'permissions',
  'settings',
  'extensions',
  'users',
] as const

export const partial = Flags.boolean({
  description: 'Enable partial template mode',
  summary: 'Enable partial template mode',
})

export const componentFlags = {
  content: Flags.boolean({allowNo: true, default: undefined, description: 'Include content/data'}),
  dashboards: Flags.boolean({allowNo: true, default: undefined, description: 'Include dashboards and panels'}),
  extensions: Flags.boolean({allowNo: true, default: undefined, description: 'Include extensions'}),
  files: Flags.boolean({allowNo: true, default: undefined, description: 'Include files, folders, and assets'}),
  flows: Flags.boolean({allowNo: true, default: undefined, description: 'Include flows and operations'}),
  permissions: Flags.boolean({
    allowNo: true,
    default: undefined,
    description: 'Include permissions, roles, policies, and access',
  }),
  schema: Flags.boolean({
    allowNo: true,
    default: undefined,
    description: 'Include schema, collections, fields, and relations',
  }),
  settings: Flags.boolean({
    allowNo: true,
    default: undefined,
    description: 'Include settings, translations, and presets',
  }),
  users: Flags.boolean({allowNo: true, default: undefined, description: 'Include users'}),
}

export const collections = Flags.string({
  description: 'Only include these comma-separated collections',
})

export const excludeCollections = Flags.string({
  aliases: ['exclude-collections'],
  description: 'Exclude these comma-separated collections',
})

export const relationStrategy = Flags.string({
  aliases: ['relation-strategy'],
  description: 'How to handle relations to omitted data',
  options: ['empty', 'preserve', 'deep'],
})

export const allowBrokenRelations = Flags.boolean({
  aliases: ['allow-broken-relations'],
  default: false,
  description: 'Allow intentionally incomplete relation references',
})

export const noAssets = Flags.boolean({
  aliases: ['no-assets'],
  default: undefined,
  description: 'Shorthand for --no-files and --exclude-collections directus_files',
})
