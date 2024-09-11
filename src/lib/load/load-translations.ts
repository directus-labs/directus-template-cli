import {createTranslations, readTranslations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

export default async function loadTranslations(dir: string) {
  ux.action.start('Loading translations')
  const translations = readFile('translations', dir)

  // Fetch existing translations
  const existingTranslations = await api.client.request(readTranslations({
    limit: -1,
  }))
  const existingTranslationKeys = new Set(existingTranslations.map(t => `${t.language}_${t.key}`))

  const newTranslations = translations.filter(t => {
    const key = `${t.language}_${t.key}`
    if (existingTranslationKeys.has(key)) {
      ux.log(`Skipping existing translation: ${key}`)
      return false
    }

    return true
  })

  if (newTranslations.length > 0) {
    try {
      await api.client.request(createTranslations(newTranslations))
      ux.log(`Created ${newTranslations.length} new translations`)
    } catch (error) {
      catchError(error)
    }
  } else {
    ux.log('No new translations to create')
  }

  ux.action.stop()
  ux.log('Loaded translations')
}
