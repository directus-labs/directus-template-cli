import readFile from '../utils/readFile'
import loadToDestination from '../utils/loadToDestination'
export default loadDashboards = async () => {
  const dashboards = readFile('dashboards')
  const filteredDashboards = dashboards.map(dash => {
    const newDash = {...dash}
    delete newDash.panels
    return newDash
  })
  await loadToDestination('dashboards', filteredDashboards)
}
