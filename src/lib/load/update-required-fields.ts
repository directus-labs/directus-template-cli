
import {updateField} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

export default async function updateRequiredFields(dir: string) {
  const fieldsToUpdate = readFile('fields', dir)
  .filter(field => field.meta.required === true)

  ux.action.start(ux.colorize(DIRECTUS_PINK, `Updating ${fieldsToUpdate.length} fields to required`))

  for await (const field of fieldsToUpdate) {
    try {
      await api.client.request(updateField(field.collection, field.field, {meta: {required: true}}))
    } catch (error) {
      catchError(error)
    }
  }

  ux.action.stop()
}
