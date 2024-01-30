import {createPresets} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

export default async function loadPresets(dir: string) {
  ux.action.start('Loading presets')
  const presets = readFile('presets', dir)

  const cleanPresets = presets.map(preset => {
    preset.user = null
    return preset
  })
  try {
    await api.client.request(createPresets(cleanPresets))
  } catch (error) {
    logError(error)
  }

  ux.action.stop()
  ux.log('Loaded presets')
}
