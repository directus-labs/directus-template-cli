import {api} from '../api'
export default async function loadToDestination(entity: string, rawData: any[])  {
  for (const row of rawData) {
    try {
      const {data}:{data} = await api.post(entity, row)
    } catch (error) {
      console.log(
        `error with ${entity} - ${row.id}`,
        error.response.data.errors,
      )
    }
  }
}
