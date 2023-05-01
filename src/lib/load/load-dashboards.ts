import loadToDestination from '../utils/load-to-destination'
export default async function loadDashboards(dashboards: any) {
  const filteredDashboards = dashboards.map(dash => {
    const newDash = {...dash}
    delete newDash.panels
    return newDash
  })
  await loadToDestination('dashboards', filteredDashboards)
}
