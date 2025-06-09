import {readDashboards, readPanels} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import filterFields from '../utils/filter-fields.js'
import {directusDashboardFields, directusPanelFields} from '../utils/system-fields.js'
import writeToFile from '../utils/write-to-file.js'

/**
 * Extract dashboards from the Directus instance
 */

export async function extractDashboards(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting dashboards'))
  try {
    const response = await api.client.request(readDashboards({limit: -1}))
    const dashboards = filterFields(response, directusDashboardFields)
    await writeToFile('dashboards', dashboards, dir)
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}

/**
 * Extract panels from the Directus instance
 */

export async function extractPanels(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting panels'))
  try {
    const response = await api.client.request(readPanels({limit: -1}))
    const panels = filterFields(response, directusPanelFields)
    await writeToFile('panels', panels, dir)
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
