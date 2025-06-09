import {readPresets} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import writeToFile from '../utils/write-to-file.js'

/**
 * Extract Presets from the API
 */

export default async function extractPresets(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting presets'))
  try {
    const response = await api.client.request(readPresets(
      {
        // Only get the global presets
        filter: {user: {
          _null: true,
        }},
        limit: -1,
      },
    ))

    // Remove the id field from the presets so we don't have to reset the autoincrement on the db
    const presets = response.map(preset => {
      delete preset.id
      return preset
    })
    await writeToFile('presets', presets, dir)
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
