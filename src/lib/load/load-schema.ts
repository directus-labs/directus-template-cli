import {schemaApply, schemaDiff} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

export default async (dir: string) => {
  ux.log('Loading schema • collections, fields, and relations...')
  const schema = readFile('snapshot', dir)

  // @ts-ignore
  const data = await api.client.request(schemaDiff(schema, true))

  if (!data) {
    ux.log('No schema to apply')
    return
  }

  try {
    await api.client.request(schemaApply(data))

    ux.log('Loaded schema')
  } catch (error) {
    logError(error)
  }
}
