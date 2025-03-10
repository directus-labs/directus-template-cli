import {Hook} from '@oclif/core'

import {PostHogService} from '../../services/posthog'

interface AnalyticsData {
  command: string
  error?: string
  frontend?: string
  success: boolean
  template?: string
  url?: string
}

const hook: Hook.Postrun = async function (opts) {
  if (!opts.Command) return

  const command = opts.Command.id
  const flags = opts.Command.flags || {}

  try {
    const analyticsData = {
      command,
      success: true,
    } as const

    // Create a new object with the optional properties based on command
    const eventData = (() => {
      switch (command) {
      case 'init': {
        return {
          ...analyticsData,
          frontend: String(flags.frontend || ''),
          template: String(flags.template || ''),
        }
      }

      case 'apply': {
        return {
          ...analyticsData,
          template: String(flags.templateLocation || ''),
          url: String(flags.directusUrl || ''),
        }
      }

      case 'extract': {
        return {
          ...analyticsData,
          url: String(flags.url || ''),
        }
      }

      default: {
        return analyticsData
      }
      }
    })()

    await PostHogService.getInstance().trackCommandComplete(eventData)
    // Important: Make sure we wait for shutdown
    await PostHogService.getInstance().shutdown()
  } catch (error) {
    console.error('Error in PostHog tracking:', error)
  }
}

export default hook
