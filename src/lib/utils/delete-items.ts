import {api} from '../api'

export default async function deleteItems(collection: string) {
  const {data}: {data} = await api.get(collection, {
    params: {
      limit: -1,
    },
  })
  const ids = data.data.map(i => i.id)
  await api.delete(collection, {
    data: ids,
  })
}
