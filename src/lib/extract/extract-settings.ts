import {readSettings} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import writeToFile from '../utils/write-to-file'

/**
 * Extract settings from the Directus instance
 */

export default async function extractSettings(dir: string) {
  try {
    const settings = await api.client.request(readSettings(
      {limit: -1},
    ))

    await writeToFile('settings', settings, dir)
    ux.log('Extracted settings')
  } catch (error) {
    ux.warn('Error extracting Settings:')
    ux.warn(error.message)
  }
}
