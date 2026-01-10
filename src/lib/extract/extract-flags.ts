import {ux} from '@oclif/core'

export interface ExtractOptions {
  content: boolean;
  dashboards: boolean;
  extensions: boolean;
  files: boolean;
  flows: boolean;
  permissions: boolean;
  schema: boolean;
  settings: boolean;
  users: boolean;
}

export interface ExtractFlags extends ExtractOptions {
  directusToken: string;
  directusUrl: string;
  programmatic: boolean;
  templateLocation: string;
  templateName: string;
  userEmail: string;
  userPassword: string;
  disableTelemetry?: boolean;
  partial?: boolean;
}

export const extractFlags = [
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

export function validateExtractFlags(flags: ExtractFlags): ExtractFlags {
  return flags.partial ? handlePartialFlags(flags) : setAllFlagsTrue(flags)
}

function handlePartialFlags(flags: ExtractFlags): ExtractFlags {
  const enabledFlags = extractFlags.filter(flag => flags[flag] === true)
  const disabledFlags = extractFlags.filter(flag => flags[flag] === false)

  if (enabledFlags.length > 0) {
    for (const flag of extractFlags) flags[flag] = enabledFlags.includes(flag)
  } else if (disabledFlags.length > 0) {
    for (const flag of extractFlags) flags[flag] = !disabledFlags.includes(flag)
  } else {
    setAllFlagsTrue(flags)
  }

  if (!extractFlags.some(flag => flags[flag])) {
    ux.error('When using --partial, at least one component must be extracted.')
  }

  return flags
}

function setAllFlagsTrue(flags: ExtractFlags): ExtractFlags {
  for (const flag of extractFlags) flags[flag] = true
  return flags
}
