import {createPresets, readPresets} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

export default async function loadPresets(dir: string) {
  const presets = readFile('presets', dir)
  ux.action.start(`Loading ${presets.length} presets`)

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
      ux.log(`Created ${presetsToAdd.length} new presets`)
    } catch (error) {
      catchError(error)
    }
  } else {
    ux.log('No new presets to create')
  }

  ux.action.stop()
  ux.log('Loaded presets')
}
