import {updateSettings} from '@directus/sdk'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

export default async function loadSettings(dir: string) {
  const settings = readFile('settings', dir)
  try {
    // @ts-ignore
    await api.client.request(updateSettings(settings))
  } catch (error) {
    logError(error)
  }
}
