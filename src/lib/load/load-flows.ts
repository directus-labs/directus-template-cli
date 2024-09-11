import {createFlow, createOperations, readFlows, updateOperation} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

export default async function loadFlows(dir: string) {
  const flows = readFile('flows', dir)
  ux.action.start(`Loading ${flows.length} flows`)

  // Fetch existing flows
  const existingFlows = await api.client.request(readFlows({
    limit: -1,
  }))
  const existingFlowIds = new Set(existingFlows.map(flow => flow.id))

  const cleanedUpFlows = flows.map(flow => {
    const cleanFlow = {...flow}
    delete cleanFlow.operations
    return cleanFlow
  })

  for (const flow of cleanedUpFlows) {
    try {
      if (existingFlowIds.has(flow.id)) {
        ux.log(`Skipping existing flow: ${flow.name}`)
        continue
      }

      await api.client.request(createFlow(flow))
      existingFlowIds.add(flow.id)
    } catch (error) {
      catchError(error)
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
      catchError(error)
    }
  }
}
