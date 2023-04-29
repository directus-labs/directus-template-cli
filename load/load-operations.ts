import {readFile} from '../utils/readFile'
import deleteItems from '../legacy/deleteItems'
import {api} from '../api'
export default loadOperations = async () => {
  await deleteItems('operations')
  const ops = readFile('operations')
  const opsIds = ops.map(i => {
    const del = {...i}
    delete del.resolve
    delete del.reject
    return del
  })
  try {
    await api.post('operations', opsIds)
    for (const op of ops) {
      const pl = {
        resolve: op.resolve,
        reject: op.reject,
      }
      console.log(`updateing ${op.id} with`, pl)
      await api.patch(`operations/${op.id}`, pl)
    }
  } catch (error) {
    console.log(error.response.data.errors)
  }
}
