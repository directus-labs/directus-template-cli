
import {updateField} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import readFile from '../utils/read-file.js'

export default async function updateRequiredFields(dir: string) {
  const fieldsToUpdate = readFile('fields', dir)
  .filter(field => field.meta.required === true || field.schema?.is_nullable === false || field.schema?.is_unique === true)

  ux.action.start(ux.colorize(DIRECTUS_PINK, `Updating ${fieldsToUpdate.length} fields to required`))

  for await (const field of fieldsToUpdate) {
    try {
      await api.client.request(updateField(field.collection, field.field, {meta: {...field.meta}, schema: {...field.schema}}))
    } catch (error) {
      catchError(error)
    }
  }

  ux.action.stop()
}
