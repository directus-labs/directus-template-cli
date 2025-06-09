import {createFlow, createOperations, readFlows, updateOperation} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import readFile from '../utils/read-file.js'

export default async function loadFlows(dir: string) {
  const flows = readFile('flows', dir)
  const allOperations = readFile('operations', dir)
  ux.action.start(ux.colorize(DIRECTUS_PINK, `Loading ${flows.length} flows`))

  if (flows && flows.length > 0) {
    try {
      // Fetch existing flows
      const existingFlows = await api.client.request(readFlows({
        limit: -1,
      }))
      const existingFlowIds = new Set(existingFlows.map(flow => flow.id))

      const newFlows = flows.filter(flow => !existingFlowIds.has(flow.id))

      const results = await Promise.allSettled(newFlows.map(flow =>
        api.client.request(createFlow(flow)),
      ))

      const createdFlowIds = new Set<string>()
      for (const [index, result] of results.entries()) {
        if (result.status === 'fulfilled') {
          createdFlowIds.add(newFlows[index].id)
        } else {
          catchError(result.reason)
        }
      }

      // Filter operations for newly created flows
      const newOperations = allOperations.filter(operation => createdFlowIds.has(operation.flow))

      await loadOperations(newOperations)
    } catch (error) {
      catchError(error)
    } finally {
      ux.action.stop()
    }
  }
}

export async function loadOperations(operations: any[]) {
  ux.action.status = `Loading ${operations.length} operations`

  try {
    const opsIds = operations.map(operation => {
      const opCopy = {...operation}
      opCopy.reject = undefined
      opCopy.resolve = undefined
      return opCopy
    })

    await api.client.request(createOperations(opsIds))

    const results = await Promise.allSettled(operations.map(operation =>
      api.client.request(updateOperation(operation.id, {
        reject: operation.reject,
        resolve: operation.resolve,
      })),
    ))

    for (const [index, result] of results.entries()) {
      if (result.status === 'rejected') {
        catchError(result.reason)
      }
    }
  } catch (error) {
    catchError(error)
  }
}
