
import deleteItems from '../utils/delete-items'
import {api} from '../api'
export default async function loadOperations(ops: any) {
  await deleteItems('operations')
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
