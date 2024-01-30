import {readPresets} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import writeToFile from '../utils/write-to-file'

/**
 * Extract Presets from the API
 */

export default async function extractPresets(dir: string) {
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
    const presets = response.map((preset: any) => {
      delete preset.id
      return preset
    })

    await writeToFile('presets', presets, dir)
    ux.log('Extracted presets')
  } catch (error) {
    ux.warn('Error extracting Users:')
    ux.warn(error.message)
  }
}
