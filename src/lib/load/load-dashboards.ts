import {createDashboard, createPanel} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

export default async function loadDashboards(dir: string) {
  const dashboards = readFile('dashboards', dir)
  ux.action.start(`Loading ${dashboards.length} dashboards`)

  const filteredDashboards = dashboards.map(dash => {
    const newDash = {...dash}
    delete newDash.panels
    return newDash
  })

  for (const dashboard of filteredDashboards) {
    try {
      await api.client.request(createDashboard(dashboard))
    } catch (error) {
      logError(error)
    }
  }

  await loadPanels(dir)

  ux.action.stop()
  ux.log('Loaded Dashboards')
}

export async function loadPanels(dir: string) {
  const panels = readFile('panels', dir)
  ux.log(`Loading ${panels.length} panels`)

  for (const panel of panels) {
    try {
      await api.client.request(createPanel(panel))
    } catch (error) {
      logError(error)
    }
  }
}
