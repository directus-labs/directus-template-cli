
import type {DirectusSettings} from '@directus/sdk'

import {readSettings, updateSettings} from '@directus/sdk'
import {defu} from 'defu'

import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

export default async function loadSettings(dir: string) {
  const settings = readFile('settings', dir)

  try {
    // Get the current settings and merge them with current settings as defaults. To prevent overriding any logos, themes, etc.
    const currentSettings = await api.client.request(readSettings())
    const mergedSettings = defu(currentSettings, settings) as DirectusSettings
    await api.client.request(updateSettings(mergedSettings))
  } catch (error) {
    catchError(error)
  }
}
