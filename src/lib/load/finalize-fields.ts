import {updateField} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import {includesSchemaCollection, type TemplatePlan} from '../template-plan/index.js'
import catchError from '../utils/catch-error.js'
import readFile from '../utils/read-file.js'

export default async function finalizeFields(dir: string, plan?: TemplatePlan) {
  const fields = readFile('fields', dir).filter((field: any) => includesSchemaCollection(field.collection, plan))

  ux.action.start(ux.colorize(DIRECTUS_PINK, `Finalizing metadata for ${fields.length} fields`))

  for await (const field of fields) {
    try {
      await api.client.request(
        updateField(field.collection, field.field, {
          meta: field.meta ? {...field.meta} : undefined,
          schema: field.schema ? {...field.schema} : undefined,
        }),
      )
    } catch (error) {
      catchError(error)
    }
  }

  ux.action.stop()
}
