import {Hook} from '@oclif/core'

import {PostHogService} from '../../services/posthog'

const hook: Hook.CommandNotFound = async function (opts) {
  await PostHogService.getInstance().trackCommandComplete({
    command: opts.id ?? 'unknown',
    error: `Command not found: ${opts.id}`,
    success: false,
  })
}

export default hook
