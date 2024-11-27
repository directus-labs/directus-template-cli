import {createPresets, readPresets} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

export default async function loadPresets(dir: string) {
  const presets = readFile('presets', dir)
  ux.action.start(ux.colorize(DIRECTUS_PINK, `Loading ${presets.length} presets`))

  if (presets && presets.length > 0) {
    // Fetch existing presets
    const existingPresets = await api.client.request(readPresets({
      limit: -1,
    }))
    const existingPresetIds = new Set(existingPresets.map(preset => preset.id))

    const presetsToAdd = presets.filter(preset => {
      if (existingPresetIds.has(preset.id)) {
        return false
      }

      return true
    }).map(preset => {
      const cleanPreset = {...preset}
      cleanPreset.user = null
      return cleanPreset
    })

    if (presetsToAdd.length > 0) {
      try {
        await api.client.request(createPresets(presetsToAdd))
      } catch (error) {
        catchError(error)
      }
    } else {
    // ux.info('-- No new presets to create')
    }
  }

  ux.action.stop()
}
