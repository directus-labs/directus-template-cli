import {ux} from '@oclif/core'

import {DirectusError} from '../sdk.js'
import {logger} from '../utils/logger.js'
import { captureException } from '../../services/posthog.js'
import { getExecutionContext } from '../../services/execution-context.js'

/**
 * Options for configuring the error handler behavior.
 */
interface ErrorHandlerOptions {
  /** Additional context to be included in the error log. */
  context?: Record<string, unknown>
  /** If true, the error will be treated as fatal and the process will exit. */
  fatal?: boolean
  /** If true, the error will be logged to a file. */
  logToFile?: boolean
}

/**
 * Handles errors by formatting them and optionally logging to console and file.
 * @param error - The error to be handled.
 * @param options - Configuration options for error handling.
 * @returns void
 */
export default function catchError(error: unknown, options: ErrorHandlerOptions = {}): void {
  const { context = {}, fatal = false, logToFile = true } = options

  const { distinctId, disableTelemetry } = getExecutionContext()

  let errorMessage: string

  if (error instanceof DirectusError) {
    errorMessage = error.message
  } else if (error instanceof Error) {
    errorMessage = `Error: ${error.message}`
  } else {
    errorMessage = `Unknown error: ${JSON.stringify(error)}`
  }

  // Capture exception before logging/exiting
  if (!disableTelemetry && distinctId) {
    captureException({error, distinctId, properties: {context}})
  }

  // Format the error message with context if provided
  const formattedMessage = [
    errorMessage,
    Object.keys(context).length > 0 && `Context: ${JSON.stringify(context)}`,
  ].filter(Boolean).join('\n')

  // Log the error message to the console with the appropriate color
  if (fatal) {
    // ux.error exits the process with a non-zero code
    ux.error(formattedMessage)
  } else {
    ux.warn(formattedMessage)
  }

  if (logToFile) {
    logger.log('error', errorMessage, context)
  }
}
