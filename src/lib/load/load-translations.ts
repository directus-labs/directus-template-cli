import {createTranslations, readTranslations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import readFile from '../utils/read-file.js'

export default async function loadTranslations(dir: string) {
  const translations = readFile('translations', dir)
  ux.action.start(ux.colorize(DIRECTUS_PINK, `Loading ${translations.length} translations`))

  if (translations && translations.length > 0) {
  // Fetch existing translations
    const existingTranslations = await api.client.request(readTranslations({
      limit: -1,
    }))
    const existingTranslationKeys = new Set(existingTranslations.map(t => `${t.language}_${t.key}`))

    const newTranslations = translations.filter(t => {
      const key = `${t.language}_${t.key}`
      if (existingTranslationKeys.has(key)) {
        return false
      }

      return true
    })

    if (newTranslations.length > 0) {
      try {
        await api.client.request(createTranslations(newTranslations))
      } catch (error) {
        catchError(error, {
      context: {operation: 'load_translations'},
      fatal: true,
    })
      }
    } else {
    // ux.stdout('-- No new translations to create')
    }
  }

  ux.action.stop()
}
