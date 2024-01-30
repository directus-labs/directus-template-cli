import {createTranslations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

export default async function loadTranslations(dir: string) {
  ux.action.start('Loading translations')
  const translations = readFile('translations', dir)

  try {
    await api.client.request(createTranslations(translations))
  } catch (error) {
    logError(error)
  }

  ux.action.stop()
  ux.log('Loaded translations')
}
