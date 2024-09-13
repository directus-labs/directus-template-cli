import {ux} from '@oclif/core'

import {DirectusError} from '../sdk'
import {logger} from '../utils/logger'

/**
 * Options for configuring the error handler behavior.
 */
interface ErrorHandlerOptions {
  /** Additional context to be included in the error log. */
  context?: Record<string, any>
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
  const {context = {}, fatal = false, logToFile = true} = options

  let errorMessage: string

  if (error instanceof DirectusError) {
    errorMessage = error.message
  } else if (error instanceof Error) {
    errorMessage = `Error: ${error.message}`
  } else {
    errorMessage = `Unknown error: ${JSON.stringify(error)}`
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
