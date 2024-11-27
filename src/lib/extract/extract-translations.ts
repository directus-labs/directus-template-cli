import {readTranslations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import writeToFile from '../utils/write-to-file'

/**
 * Extract translations from the Directus instance
 */

export default async function extractTranslations(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting translations'))
  try {
    const translations = await api.client.request(readTranslations({limit: -1}))
    await writeToFile('translations', translations, dir)
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
