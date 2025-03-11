import {readSettings} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
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
    await writeToFile('settings', settings, dir)
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
