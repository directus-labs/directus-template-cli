import {readTranslations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import writeToFile from '../utils/write-to-file'

/**
 * Extract translations from the Directus instance
 */

export default async function extractTranslations(dir: string) {
  try {
    const translations = await api.client.request(readTranslations({
      limit: -1,
    }))

    await writeToFile('translations', translations, dir)
    ux.log('Extracted translations')
  } catch (error) {
    ux.warn('Error extracting Translations:')
    ux.warn(error.message)
  }
}
