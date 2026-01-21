import {readTranslations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import writeToFile from '../utils/write-to-file.js'

/**
 * Extract translations from the Directus instance
 */

export default async function extractTranslations(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting translations'))
  try {
    const translations = await api.client.request(readTranslations({limit: -1}))
    await writeToFile('translations', translations, dir)
  } catch (error) {
    catchError(error, {
      context: {operation: 'extract_translations'},
      fatal: true,
    })
  }

  ux.action.stop()
}
