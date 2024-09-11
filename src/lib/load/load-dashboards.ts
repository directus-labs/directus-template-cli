import {createDashboard, createPanel, readDashboards, readPanels} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

export default async function loadDashboards(dir: string) {
  const dashboards = readFile('dashboards', dir)
  ux.action.start(`Loading ${dashboards.length} dashboards`)

  // Fetch existing dashboards
  const existingDashboards = await api.client.request(readDashboards({
    limit: -1,
  }))
  const existingDashboardIds = new Set(existingDashboards.map(dashboard => dashboard.id))

  const filteredDashboards = dashboards.filter(dashboard => {
    if (existingDashboardIds.has(dashboard.id)) {
      ux.log(`Skipping existing dashboard: ${dashboard.name}`)
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
      ux.log(`Created new dashboard: ${dashboard.name}`)
    } catch (error) {
      catchError(error)
    }
  }))

  await loadPanels(dir)

  ux.action.stop()
  ux.log('Loaded dashboards')
}

export async function loadPanels(dir: string) {
  const panels = readFile('panels', dir)
  ux.log(`Loading ${panels.length} panels`)

  // Fetch existing panels
  const existingPanels = await api.client.request(readPanels({
    limit: -1,
  }))
  const existingPanelIds = new Set(existingPanels.map(panel => panel.id))

  const filteredPanels = panels.filter(panel => {
    if (existingPanelIds.has(panel.id)) {
      ux.log(`Skipping existing panel: ${panel.id}`)
      return false
    }

    return true
  })

  await Promise.all(filteredPanels.map(async panel => {
    try {
      await api.client.request(createPanel(panel))
      ux.log(`Created new panel: ${panel.id}`)
    } catch (error) {
      catchError(error)
    }
  }))
}
