import {ux} from '@oclif/core'

import catchError from '../utils/catch-error.js'

export interface ApplyFlags {
  content: boolean;
  dashboards: boolean;
  directusToken: string;
  directusUrl: string;
  extensions: boolean;
  files: boolean;
  flows: boolean;
  partial: boolean;
  permissions: boolean;
  programmatic: boolean;
  schema: boolean;
  settings: boolean;
  templateLocation: string;
  templateType: 'community' | 'github' | 'local';
  userEmail: string;
  userPassword: string;
  users: boolean;
}

export const loadFlags = [
  'content',
  'dashboards',
  'extensions',
  'files',
  'flows',
  'permissions',
  'schema',
  'settings',
  'users',
] as const

export function validateProgrammaticFlags(flags: ApplyFlags): ApplyFlags {
  const {directusToken, directusUrl, templateLocation, userEmail, userPassword} = flags

  if (!directusUrl) ux.error('Directus URL is required for programmatic mode.')
  if (!directusToken && (!userEmail || !userPassword)) ux.error('Either Directus token or email and password are required for programmatic mode.')
  if (!templateLocation) ux.error('Template location is required for programmatic mode.')

  return flags.partial ? handlePartialFlags(flags) : setAllFlagsTrue(flags)
}

export function validateInteractiveFlags(flags: ApplyFlags): ApplyFlags {
  return flags.partial ? handlePartialFlags(flags) : setAllFlagsTrue(flags)
}

function handlePartialFlags(flags: ApplyFlags): ApplyFlags {
  const enabledFlags = loadFlags.filter(flag => flags[flag] === true)
  const disabledFlags = loadFlags.filter(flag => flags[flag] === false)

  if (enabledFlags.length > 0) {
    for (const flag of loadFlags) flags[flag] = enabledFlags.includes(flag)
  } else if (disabledFlags.length > 0) {
    for (const flag of loadFlags) flags[flag] = !disabledFlags.includes(flag)
  } else {
    setAllFlagsTrue(flags)
  }

  handleDependencies(flags)

  if (!loadFlags.some(flag => flags[flag])) {
    catchError(new Error('When using --partial, at least one component must be loaded.'), {fatal: true})
  }

  return flags
}

function handleDependencies(flags: ApplyFlags): void {
  if (flags.content && (!flags.schema || !flags.files)) {
    flags.schema = flags.files = true
    ux.warn('Content loading requires schema and files. Enabling schema and files flags.')
  }

  if (flags.users && !flags.permissions) {
    flags.permissions = true
    ux.warn('User loading requires permissions. Enabling permissions flag.')
  }
}

function setAllFlagsTrue(flags: ApplyFlags): ApplyFlags {
  for (const flag of loadFlags) flags[flag] = true
  return flags
}
