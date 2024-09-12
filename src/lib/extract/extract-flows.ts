import {readFlows, readOperations} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import filterFields from '../utils/filter-fields'
import {directusFlowFields, directusOperationFields} from '../utils/system-fields'
import writeToFile from '../utils/write-to-file'

/**
 * Extract flows from the Directus instance
 */

export async function extractFlows(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting flows'))
  try {
    const response = await api.client.request(readFlows({limit: -1}))
    const flows = filterFields(response, directusFlowFields)
    await writeToFile('flows', flows, dir)
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}

/**
 * Extract operations from the Directus instance
 */

export async function extractOperations(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting operations'))
  try {
    const response = await api.client.request(readOperations({limit: -1}))
    const operations = filterFields(response, directusOperationFields)
    await writeToFile('operations', operations, dir)
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
