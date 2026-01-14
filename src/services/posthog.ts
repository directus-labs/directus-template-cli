import type {Config} from '@oclif/core'

import {ux} from '@oclif/core'
import {PostHog} from 'posthog-node'

import {POSTHOG_HOST, POSTHOG_PUBLIC_KEY} from '../lib/constants.js'
import {sanitizeFlags} from '../lib/utils/sanitize-flags.js'

// Create a singleton client using module scope
let client: null | PostHog = null

/**
 * Initialize and get the PostHog client
 * @param debug Whether to log debug information
 * @returns The PostHog client
 */
export function getClient(debug = false): PostHog {
  if (debug) ux.stdout('Initializing PostHog client...')

  if (!client) {
    client = new PostHog(
      POSTHOG_PUBLIC_KEY,
      {
        disableGeoip: false,
        host: POSTHOG_HOST,
      },
    )

    // Add error handling
    client.on('error', err => {
      ux.warn(`PostHog Error: ${err}`)
    })
  }

  if (debug) ux.stdout('PostHog client initialized successfully')
  return client
}

/**
 * Shutdown the PostHog client
 * @param debug Whether to log debug information
 * @returns void
 */
export async function shutdown(debug = false): Promise<void> {
  if (debug) ux.stdout('Shutting down PostHog client...')
  if (!client) return

  try {
    await client.shutdown()
    client = null
    if (debug) ux.stdout('PostHog client shut down successfully')
  } catch (error) {
    ux.warn(`Error shutting down PostHog client: ${error}`)
  }
}

/**
 * Track an event in PostHog
 * @param options The tracking options
 * @param options.lifecycle The lifecycle event to track ('start', 'complete', 'error')
 * @param options.distinctId The distinct ID for the user
 * @param options.command Optional command name (for command tracking)
 * @param options.flags Optional command flags
 * @param options.runId Optional run ID
 * @param options.config Optional config object
 * @param options.properties Optional additional properties to track
 * @param options.debug Whether to log debug information
 */
export function track({
  command,
  config,
  debug = false,
  distinctId,
  flags,
  lifecycle,
  message,
  properties = {},
  runId
}: {
  command?: string,
  config?: Config,
  debug?: boolean
  distinctId: string,
  flags?: Record<string, unknown>,
  lifecycle: 'complete' | 'error' | 'start',
  message?: string,
  properties?: Record<string, unknown>,
  runId?: string,
}): void {
  if (debug) ux.stdout('Tracking event...')

  const phClient = getClient(debug)

  const eventProperties = command
    ? {
        message,
        runId,
        ...properties,
        ...getEnvironmentInfo(config),
        // Always sanitize sensitive flags
        ...sanitizeFlags(flags),
      }
    : properties;

  if (debug) {
    ux.stdout('Capturing event...')
    ux.stdout(JSON.stringify(eventProperties))
  }

  phClient.capture({
    distinctId,
    event: `directus_template_cli.${command}.${lifecycle}`,
    properties: {eventProperties}
  })

  if (debug) ux.stdout('Event tracked successfully')
}

/**
 * Manually capture an exception in PostHog
 * @param error The error object to capture
 * @param distinctId The distinct ID for the user
 * @param properties Optional additional properties to track
 * @param debug Whether to log debug information
 */
export function captureException({
  debug = false,
  distinctId,
  error,
  properties = {}
}: {
  debug?: boolean
  distinctId: string,
  error: unknown,
  properties?: Record<string, unknown>,
}): void {
  if (debug) ux.stdout('Capturing exception...')

  const phClient = getClient(debug)

  const exceptionProperties = properties

  if (debug) {
    ux.stdout('Sending exception data:')
    ux.stdout(`Error: ${error}`)
    ux.stdout(`Properties: ${JSON.stringify(exceptionProperties)}`)
  }

  try {
    phClient.captureException(error, distinctId, properties)
    if (debug) ux.stdout('Exception captured successfully')
  } catch (captureError) {
    ux.warn(`Failed to capture PostHog exception: ${captureError}`)
  }
}

/**
 * Get environment info
 * @param config The config to get environment info from
 * @returns The environment info
 */
function getEnvironmentInfo(config?: Config): Record<string, unknown> {
  return {
    // PostHog properties
    $os: process.platform,
    $raw_user_agent: config?.userAgent || 'unknown',
    // Custom properties
    arch: process.arch || 'unknown',
    nodeVersion: process.version,
    platform: config?.platform || 'unknown',
    shell: config?.shell || 'unknown',
    version: config?.version || 'unknown',
  };
}
