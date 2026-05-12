import {ux} from '@oclif/core'

import {buildTemplatePlan, componentNames} from '../template-plan/index.js'

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
  relationStrategy?: 'deep' | 'empty' | 'ids'
  schema: boolean
  settings: boolean
  templateLocation: string
  templateType: 'community' | 'github' | 'local'
  userEmail: string
  userPassword: string
  users?: boolean
}

export const loadFlags = componentNames

export function validateProgrammaticFlags(flags: ApplyFlags): ApplyFlags {
  const {directusToken, directusUrl, templateLocation, userEmail, userPassword} = flags

  if (!directusUrl) ux.error('Directus URL is required for programmatic mode.')
  if (!directusToken && (!userEmail || !userPassword))
    ux.error('Either Directus token or email and password are required for programmatic mode.')
  if (!templateLocation) ux.error('Template location is required for programmatic mode.')

  return applyTemplatePlan(flags)
}

export function validateInteractiveFlags(flags: ApplyFlags): ApplyFlags {
  return applyTemplatePlan(flags)
}

function applyTemplatePlan(flags: ApplyFlags): ApplyFlags {
  const plan = buildTemplatePlan(flags)
  const nextFlags = {...flags, partial: plan.partial}

  for (const flag of loadFlags) nextFlags[flag] = plan.components[flag]

  if (plan.partial) ux.warn('Applying partial template. Missing components will not be auto-enabled.')

  return nextFlags
}
