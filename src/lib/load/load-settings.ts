import type {DirectusSettings} from '@directus/sdk'

import {readSettings, updateSettings} from '@directus/sdk'
import {ux} from '@oclif/core'
import {createDefu} from 'defu'

import {DIRECTUS_PINK, INSTANCE_SETTINGS_KEYS} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import readFile from '../utils/read-file.js'

// Cast ux to any to bypass type errors
const customDefu = createDefu((obj, key, value) => {
  if (Array.isArray(obj[key]) && Array.isArray(value)) {
    // @ts-ignore - ignore
    obj[key] = mergeArrays(key, obj[key], value)
    return true
  }

  if (typeof obj[key] === 'string' && typeof value === 'string') {
    // @ts-ignore - ignore
    obj[key] = mergeJsonStrings(obj[key], value)
    return true
  }
})

function mergeArrays(key: string, current: any[], incoming: any[]): any[] {
  const mergeKeys = {
    basemaps: ['key'],
    custom_aspect_ratios: ['key'],
    module_bar: ['id', 'type'],
    storage_asset_presets: ['key'],
  }

  const keys = mergeKeys[key as keyof typeof mergeKeys]
  if (!keys) return [...new Set([...current, ...incoming])]

  return current.concat(
    incoming.filter((item) => !current.some((currentItem) => keys.every((k) => currentItem[k] === item[k]))),
  )
}

function mergeJsonStrings(current: string, incoming: string): string {
  try {
    return JSON.stringify(customDefu(JSON.parse(current), JSON.parse(incoming)))
  } catch {
    return incoming // If not valid JSON, return the incoming value
  }
}

/**
 * Settings Directus 12 refuses in a settings update whenever they're present, even as null
 */
const READ_ONLY_SETTINGS_KEYS = ['license_key', 'license_token'] as const

/**
 * Secret settings the API returns masked. They're writable, so a template may set them,
 * but a masked value must never be sent back (it would be stored as the new secret).
 */
const SECRET_SETTINGS_KEYS = [
  'ai_openai_api_key',
  'ai_anthropic_api_key',
  'ai_google_api_key',
  'ai_openai_compatible_api_key',
] as const

const MASKED_VALUE = '**********'

function omitKeys(settings: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  const result = {...settings}
  for (const key of keys) delete result[key]
  return result
}

/**
 * Build the settings PATCH: merge the template into the current settings without replaying
 * masked secrets, read-only license fields, or another instance's identity.
 * @param currentSettings - Settings read from the target instance
 * @param templateSettings - Settings from the template
 * @returns The payload to send to updateSettings
 */
export function buildSettingsPayload(
  currentSettings: Record<string, unknown>,
  templateSettings: Record<string, unknown>,
): Record<string, unknown> {
  // Secrets from the instance come back masked, so leave them out and the stored values stay untouched
  const current = omitKeys(currentSettings, SECRET_SETTINGS_KEYS)
  // Templates extracted from an instance carry the same masks; real values set on purpose are kept
  const maskedInTemplate = SECRET_SETTINGS_KEYS.filter(key => templateSettings[key] === MASKED_VALUE)
  // Older templates were extracted with the source instance's id and owner info
  const template = omitKeys(templateSettings, [...maskedInTemplate, ...INSTANCE_SETTINGS_KEYS])

  return omitKeys(customDefu(current, template) as Record<string, unknown>, READ_ONLY_SETTINGS_KEYS)
}

export default async function loadSettings(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Loading settings'))
  const settings = readFile('settings', dir)
  try {
    const currentSettings = await api.client.request(readSettings())
    const payload = buildSettingsPayload(currentSettings as Record<string, unknown>, settings as unknown as Record<string, unknown>)
    await api.client.request(updateSettings(payload as DirectusSettings))
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
