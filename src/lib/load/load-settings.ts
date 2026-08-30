import type {DirectusSettings} from '@directus/sdk'

import {readSettings, updateSettings} from '@directus/sdk'
import {ux} from '@oclif/core'
import {createDefu} from 'defu'

import {DIRECTUS_PINK} from '../constants.js'
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
 * Protected settings keys
 */
const PROTECTED_SETTINGS_KEYS = [
  'license_key',
  'license_token',
  'ai_openai_compatible_api_key',
  'ai_google_api_key',
  'ai_anthropic_api_key',
  'ai_openai_api_key',
] as const

/**
 * Strip protected settings from the settings object
 * @param settings - The settings object
 * @returns The settings object with protected settings removed
 */
function stripProtectedSettings<T extends object>(settings: T): T {
  const result = {...settings} as Record<string, unknown>
  for (const key of PROTECTED_SETTINGS_KEYS) delete result[key]
  return result as T
}

export default async function loadSettings(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Loading settings'))
  const settings = readFile('settings', dir)
  try {
    const currentSettings = await api.client.request(readSettings())
    const mergedSettings = stripProtectedSettings(customDefu(currentSettings as any, settings) as DirectusSettings)
    await api.client.request(updateSettings(mergedSettings))
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
