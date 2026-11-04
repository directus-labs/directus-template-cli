import {ux} from '@oclif/core'

export interface ApplyFlags {
  allowBrokenRelations?: boolean
  collections?: string
  content: boolean
  dashboards: boolean
  directusToken: string
  directusUrl: string
  disableTelemetry?: boolean
  excludeCollections?: string
  extensions: boolean
  files: boolean
  flows: boolean
  noAssets?: boolean
  noExit?: boolean
  partial: boolean
  permissions: boolean
  programmatic: boolean
  relationStrategy?: 'deep' | 'empty' | 'preserve'
  schema: boolean
  settings: boolean
  templateLocation: string
  templateType: 'community' | 'github' | 'local'
  userEmail: string
  userPassword: string
  users?: boolean
}

export function validateProgrammaticFlags(flags: ApplyFlags): ApplyFlags {
  const {directusToken, directusUrl, templateLocation, userEmail, userPassword} = flags

  if (!directusUrl) ux.error('Directus URL is required for programmatic mode.')
  if (!directusToken && (!userEmail || !userPassword))
    ux.error('Either Directus token or email and password are required for programmatic mode.')
  if (!templateLocation) ux.error('Template location is required for programmatic mode.')

  return flags
}
