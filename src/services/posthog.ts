import {ux} from '@oclif/core'
import type {Config} from '@oclif/core'
import {PostHog} from 'posthog-node'
import {POSTHOG_PUBLIC_KEY, POSTHOG_HOST} from '../lib/constants.js'
import {sanitizeFlags} from '../lib/utils/sanitize-flags.js'

// Create a singleton client using module scope
let client: PostHog | null = null

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
        host: POSTHOG_HOST,
        disableGeoip: false,
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
  lifecycle,
  distinctId,
  command,
  flags,
  runId,
  message,
  config,
  properties = {},
  debug = false
}: {
  lifecycle: 'start' | 'complete' | 'error',
  message?: string,
  distinctId: string,
  command?: string,
  flags?: Record<string, unknown>,
  runId?: string,
  config?: Config,
  properties?: Record<string, unknown>,
  debug?: boolean
}): void {
  if (debug) ux.stdout('Tracking event...')

  const phClient = getClient(debug)

  const eventProperties = command
    ? {
        runId,
        message,
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
    properties: eventProperties
  })

  if (debug) ux.stdout('Event tracked successfully')
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
