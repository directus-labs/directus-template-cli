import {createTranslations, readTranslations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

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
        catchError(error)
      }
    } else {
    // ux.info('-- No new translations to create')
    }
  }

  ux.action.stop()
}
