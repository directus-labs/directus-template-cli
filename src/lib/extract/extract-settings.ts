import {readSettings} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK, INSTANCE_SETTINGS_KEYS} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import writeToFile from '../utils/write-to-file.js'

/**
 * Extract settings from the Directus instance
 */

export default async function extractSettings(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting settings'))
  try {
    const settings = await api.client.request(readSettings({limit: -1}))
    for (const key of INSTANCE_SETTINGS_KEYS) delete (settings as Record<string, unknown>)[key]
    await writeToFile('settings', settings, dir)
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
