import {createFlow, createOperations, updateOperation} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

export default async function loadFlows(dir: string) {
  const flows = readFile('flows', dir)
  ux.action.start(`Loading ${flows.length} flows`)

  for (const flow of flows) {
    delete flow.operations
  }

  for (const flow of flows) {
    try {
      await api.client.request(createFlow(flow))
    } catch (error) {
      logError(error)
    }
  }

  await loadOperations(dir)

  ux.action.stop()
  ux.log('Loaded Flows')
}

export async function loadOperations(dir: string) {
  const operations = readFile('operations', dir)
  ux.log(`Loading ${operations.length} operations`)

  const opsIds = operations.map(i => {
    const del = {...i}
    delete del.resolve
    delete del.reject
    return del
  })

  await api.client.request(createOperations(opsIds))

  for (const operation of operations) {
    const pl = {
      reject: operation.reject,
      resolve: operation.resolve,
    }

    try {
      await api.client.request(updateOperation(operation.id, pl))
    } catch (error) {
      logError(error)
    }
  }
}
