import {ux} from '@oclif/core'

import {logger} from './logger'

interface DirectusError {
    errors: {
        extensions?: any
        message: string
    }[]
    response?: {
        status: number
    }
}

interface Options {
    context?: Record<string, any>
    fatal?: boolean
    logToFile?: boolean
}

export default function catchError(error: unknown, options: Options = {}) {
  const errorMessage = isDirectusError(error) ? formatDirectusError(error)
    : (error instanceof Error ? formatGenericError(error)
      : `Unknown error: ${JSON.stringify(error)}`)

  const contextString = options.context
    ? Object.entries(options.context)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join(', ') : ''

  const formattedMessage = [
    contextString && `Context: ${contextString}`,
    errorMessage,
  ].filter(Boolean).join('\n')

  options.fatal ? ux.error(formattedMessage) : ux.warn(formattedMessage)

  if (options.logToFile) {
    logger.log('error', errorMessage, options.context)
  }
}

function isDirectusError(error: any): error is DirectusError {
  return error && Array.isArray(error.errors) && error.errors.length > 0
}

function formatDirectusError(error: DirectusError): string {
  const status = error.response?.status || 'Unknown'
  const {extensions, message} = error.errors[0]
  return `Directus Error: ${message.trim()}${extensions ? ` (${JSON.stringify(extensions)})` : ''} (Status: ${status})`
}

function formatGenericError(error: Error): string {
  return `Error: ${error.message}`
}
