import {createDashboard, createPanel, readDashboards, readPanels} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import readFile from '../utils/read-file.js'

export default async function loadDashboards(dir: string) {
  const dashboards = readFile('dashboards', dir)
  ux.action.start(ux.colorize(DIRECTUS_PINK, `Loading ${dashboards.length} dashboards`))

  if (dashboards && dashboards.length > 0) {
    // Fetch existing dashboards
    const existingDashboards = await api.client.request(readDashboards({
      limit: -1,
    }))
    const existingDashboardIds = new Set(existingDashboards.map(dashboard => dashboard.id))

    const filteredDashboards = dashboards.filter(dashboard => {
      if (existingDashboardIds.has(dashboard.id)) {
        return false
      }

      return true
    }).map(dash => {
      const newDash = {...dash}
      delete newDash.panels
      return newDash
    })

    await Promise.all(filteredDashboards.map(async dashboard => {
      try {
        await api.client.request(createDashboard(dashboard))
      } catch (error) {
        catchError(error, {
      context: {operation: 'load_dashboards'},
      fatal: true,
    })
      }
    }))

    await loadPanels(dir)

    ux.action.stop()
  }
}

export async function loadPanels(dir: string) {
  const panels = readFile('panels', dir)
  ux.action.status = `Loading ${panels.length} panels`
  // Fetch existing panels
  const existingPanels = await api.client.request(readPanels({
    limit: -1,
  }))
  const existingPanelIds = new Set(existingPanels.map(panel => panel.id))

  const filteredPanels = panels.filter(panel => {
    if (existingPanelIds.has(panel.id)) {
      return false
    }

    return true
  })

  await Promise.all(filteredPanels.map(async panel => {
    try {
      await api.client.request(createPanel(panel))
    } catch (error) {
      catchError(error, {
      context: {operation: 'load_dashboards'},
      fatal: true,
    })
    }
  }))
}
