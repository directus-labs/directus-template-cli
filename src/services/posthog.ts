import {ux} from '@oclif/core'
import {randomUUID} from 'node:crypto'
import {PostHog} from 'posthog-node'

interface AnalyticsEvent {
  command: string
  error?: string
  frontend?: string
  success: boolean
  template?: string
  url?: string
}

export class PostHogService {
  private client: PostHog
  private commandStart: Record<string, number> = {}
  private readonly distinctId: string
  private static instance: PostHogService

  private constructor() {
    this.client = new PostHog(
      'phc_xh9F141wdEXGwHRgoee9NBGNRf5PnSERm8jIMcdLU7p',
      {
        flushAt: 1,
        flushInterval: 0,
        host: 'https://us.i.posthog.com',
      },
    )

    // Add error handling
    this.client.on('error', err => {
      ux.warn(`PostHog Error: ${err}`)
    })

    this.distinctId = randomUUID()
  }

  static getInstance(): PostHogService {
    if (!PostHogService.instance) {
      PostHogService.instance = new PostHogService()
    }

    return PostHogService.instance
  }

  async shutdown(): Promise<void> {
    try {
      ux.debug('Shutting down PostHog client...')
      await this.client.shutdown()
      ux.debug('PostHog client shut down successfully')
    } catch (error) {
      ux.warn(`Error shutting down PostHog client: ${error}`)
    }
  }

  async trackCommandComplete(event: AnalyticsEvent): Promise<void> {
    const startTime = this.commandStart[event.command]
    const duration = startTime ? Date.now() - startTime : 0
    delete this.commandStart[event.command]

    try {
      const eventData = {
        distinctId: this.distinctId,
        event: 'cli_command_complete',
        properties: {
          ...event,
          cliVersion: process.env.npm_package_version || 'unknown',
          durationMs: duration,
          nodeVersion: process.version,
          os: process.platform,
          timestamp: new Date().toISOString(),
        },
      }

      ux.debug(`Sending PostHog event: ${JSON.stringify(eventData)}`)

      await this.client.capture(eventData)
    } catch (error) {
      ux.warn(`Failed to send PostHog event: ${error}`)
    }
  }

  trackCommandStart(commandId: string): void {
    this.commandStart[commandId] = Date.now()
  }
}
