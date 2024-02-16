import {readDashboards, readPanels} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import filterFields from '../utils/filter-fields'
import {directusDashboardFields, directusPanelFields} from '../utils/system-fields'
import writeToFile from '../utils/write-to-file'

/**
 * Extract dashboards from the Directus instance
 */

export async function extractDashboards(dir: string) {
  try {
    const response = await api.client.request(readDashboards(
      {limit: -1},
    ))

    const dashboards = filterFields(response, directusDashboardFields)

    await writeToFile('dashboards', dashboards, dir)
    ux.log('Extracted dashboards')
  } catch (error) {
    ux.warn('Error extracting Dashboards:')
    ux.warn(error.message)
  }
}

/**
 * Extract panels from the Directus instance
 */

export async function extractPanels(dir: string) {
  try {
    const response = await api.client.request(readPanels(
      {limit: -1},
    ))

    const panels = filterFields(response, directusPanelFields)

    await writeToFile('panels', panels, dir)
    ux.log('Extracted panels')
  } catch (error) {
    ux.warn('Error extracting Panels:')
    ux.warn(error.message)
  }
}
