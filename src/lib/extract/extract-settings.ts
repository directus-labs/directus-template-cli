import {readSettings} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import writeToFile from '../utils/write-to-file'

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
