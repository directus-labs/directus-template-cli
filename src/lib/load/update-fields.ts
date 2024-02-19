import {updateField} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

/**
 * Update all the fields in the system as they are initially all loaded as nullable and not required.
 */

export default async function updateFields(dir: string) {
  const fields = readFile('fields', dir)
  ux.action.start(
    `Updating all the fields`,
  )

  for await (const field of fields) {
    try {
      await api.client.request(updateField(field.collection, field.field, field))
    }catch (error) {
      logError(error)
    }
  }

  ux.action.stop()
  ux.log('Updated all the fields')
}

