
import {api} from '../api'
import { ux } from '@oclif/core'
import readFile from '../utils/read-file'

export default async (dir: string) => {
  const schema = readFile('snapshot', dir)

  const {data}:{data} = await api.post('schema/diff?force', schema)
  if (!data.data) {
    console.log('No schema changes to apply')
    return
  }

  try {
    await api.post('schema/apply', data.data)
    ux.log('Loaded schema')
    // console.log('Schema Loaded')
  } catch (error) {
    console.log('Error Applying schema', error.response.data.errors)
  }
}
