import {createFlow, createOperations, readFlows, updateOperation} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

export default async function loadFlows(dir: string) {
  const flows = readFile('flows', dir)
  ux.action.start(ux.colorize(DIRECTUS_PINK, `Loading ${flows.length} flows`))

  try {
    // Fetch existing flows
    const existingFlows = await api.client.request(readFlows({
      limit: -1,
    }))
    const existingFlowIds = new Set(existingFlows.map(flow => flow.id))

    const cleanedUpFlows = flows.map(flow => {
      const {operations, ...cleanFlow} = flow
      return {cleanFlow, operations}
    })

    const newFlows = cleanedUpFlows.filter(({cleanFlow}) => !existingFlowIds.has(cleanFlow.id))

    const results = await Promise.allSettled(newFlows.map(({cleanFlow}) =>
      api.client.request(createFlow(cleanFlow)),
    ))

    const createdFlowIds = new Set<string>()
    for (const [index, result] of results.entries()) {
      if (result.status === 'fulfilled') {
        createdFlowIds.add(newFlows[index].cleanFlow.id)
      } else {
        catchError(result.reason)
      }
    }

    // Only load operations for newly created flows
    const newOperations: any[] = newFlows
    .filter(({cleanFlow}) => createdFlowIds.has(cleanFlow.id))
    .flatMap(({operations}) => operations)

    await loadOperations(newOperations)
  } catch (error) {
    catchError(error)
  } finally {
    ux.action.stop()
  }
}

export async function loadOperations(operations: any[]) {
  ux.action.status = `Loading ${operations.length} operations`

  try {
    const opsIds = operations.map(operation => {
      const opCopy = {...operation}
      delete opCopy.reject
      delete opCopy.resolve
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
